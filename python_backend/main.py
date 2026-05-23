import os
import shutil
import uuid
from datetime import date, datetime, time, timedelta
from pathlib import Path
from typing import Optional

from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles
from jose import JWTError, jwt
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload
import io
import openpyxl
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm

import database, models, schemas, utils
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="HumanResource HRM API")
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.add_middleware(GZipMiddleware, minimum_size=1000)

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

_allowed_origins = [
    o.strip()
    for o in os.getenv("FRONTEND_URL", "http://localhost:3000").split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


@app.get("/")
def root():
    return {
        "message": "HRM backend is running",
        "health": "/api/health",
        "docs": "/docs",
    }


def parse_iso_date(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone().replace(tzinfo=None)
    return parsed


def parse_date_only(value: Optional[str]) -> Optional[date]:
    if not value:
        return None
    return date.fromisoformat(value)


def start_of_day(value: date) -> datetime:
    return datetime.combine(value, time.min)


def end_of_day(value: date) -> datetime:
    return datetime.combine(value, time.max)


def days_between(start: datetime, end: datetime) -> int:
    return (end.date() - start.date()).days + 1


def make_placeholder_cnic() -> str:
    return f"TEMP-{uuid.uuid4().hex[:12].upper()}"


def normalize_cnic(value: Optional[str]) -> str:
    cleaned = (value or "").strip()
    return cleaned or make_placeholder_cnic()


def ensure_leave_types(db: Session) -> None:
    defaults = [
        ("Annual Leave", True),
        ("Sick Leave", True),
        ("Casual Leave", True),
    ]
    existing = {item.name for item in db.query(models.LeaveType).all()}
    created = False
    for name, is_paid in defaults:
        if name not in existing:
            db.add(models.LeaveType(name=name, isPaid=is_paid))
            created = True
    if created:
        db.commit()


def serialize_user(user: models.User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "linkedEmployeeId": user.linkedEmployeeId,
        "createdAt": user.createdAt,
        "name": user.name,
        "jobTitle": user.jobTitle,
        "timeZone": user.timeZone,
        "theme": user.theme,
        "emailUpdates": user.emailUpdates,
        "taskReminders": user.taskReminders,
        "securityAlerts": user.securityAlerts,
    }


def serialize_employee(employee: models.Employee) -> dict:
    cnic = employee.cnic
    if cnic and cnic.startswith("TEMP-"):
        cnic = None
    return {
        "id": employee.id,
        "name": employee.name,
        "email": employee.email,
        "phone": employee.phone,
        "cnic": cnic,
        "department": employee.department,
        "designation": employee.designation,
        "joiningDate": employee.joiningDate,
        "status": employee.status,
        "baseSalary": employee.baseSalary,
        "allowance": employee.allowance,
        "workFormat": employee.workFormat,
        "annualBalance": employee.annualBalance,
        "sickBalance": employee.sickBalance,
        "casualBalance": employee.casualBalance,
        "employeeCode": employee.employeeCode,
        "employmentType": employee.employmentType,
        "cvUrl": employee.cvUrl,
        "idDocumentUrl": employee.idDocumentUrl,
        "contractUrl": employee.contractUrl,
        "offerLetterUrl": employee.offerLetterUrl,
    }


def serialize_project(project: models.Project, task_count: Optional[int] = None) -> dict:
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "client": project.client,
        "startDate": project.startDate,
        "endDate": project.endDate,
        "status": project.status,
        "projectManagerId": project.projectManagerId,
        "projectManager": serialize_employee(project.projectManager)
        if project.projectManager
        else None,
        "_count": {"tasks": task_count if task_count is not None else len(project.tasks or [])},
    }


def serialize_task(task: models.Task) -> dict:
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "projectId": task.projectId,
        "assigneeId": task.assigneeId,
        "priority": task.priority,
        "status": task.status,
        "dueDate": task.dueDate,
        "estimatedHours": task.estimatedHours,
        "actualHours": task.actualHours,
        "createdAt": task.createdAt,
        "updatedAt": task.updatedAt,
        "startDate": task.createdAt,
        "project": serialize_project(task.project, task_count=len(task.project.tasks or []))
        if task.project
        else None,
        "assignee": serialize_employee(task.assignee) if task.assignee else None,
    }


def serialize_leave_type(leave_type: models.LeaveType) -> dict:
    return {
        "id": leave_type.id,
        "name": leave_type.name,
        "isPaid": leave_type.isPaid,
    }


def serialize_leave(leave: models.LeaveRequest) -> dict:
    return {
        "id": leave.id,
        "employeeId": leave.employeeId,
        "typeId": leave.typeId,
        "startDate": leave.startDate,
        "endDate": leave.endDate,
        "status": leave.status,
        "reason": leave.reason,
        "createdAt": leave.createdAt,
        "type": serialize_leave_type(leave.type) if leave.type else None,
        "employee": serialize_employee(leave.employee) if leave.employee else None,
    }


def serialize_attendance(record: models.Attendance) -> dict:
    return {
        "id": record.id,
        "employeeId": record.employeeId,
        "date": record.date,
        "checkIn": record.checkIn,
        "checkOut": record.checkOut,
        "totalHours": record.totalHours,
        "remarks": record.remarks,
        "status": record.status,
        "isLate": record.isLate,
        "isHalfDay": record.isHalfDay,
        "isOvertime": record.isOvertime,
        "employee": serialize_employee(record.employee) if record.employee else None,
    }


def serialize_vacancy(vacancy: models.Vacancy) -> dict:
    return {
        "id": vacancy.id,
        "title": vacancy.title,
        "department": vacancy.department,
        "location": vacancy.location,
        "employmentType": vacancy.employmentType,
        "status": vacancy.status,
        "postedDate": vacancy.postedDate,
        "closingDate": vacancy.closingDate,
        "description": vacancy.description,
        "createdAt": vacancy.createdAt,
        "updatedAt": vacancy.updatedAt,
    }


def serialize_applicant(applicant: models.Applicant) -> dict:
    return {
        "id": applicant.id,
        "vacancyId": applicant.vacancyId,
        "name": applicant.name,
        "email": applicant.email,
        "phone": applicant.phone,
        "resumeUrl": applicant.resumeUrl,
        "status": applicant.status,
        "appliedAt": applicant.appliedAt,
        "notes": applicant.notes,
        "vacancy": serialize_vacancy(applicant.vacancy) if applicant.vacancy else None,
    }


def serialize_training(training: models.EmployeeTraining) -> dict:
    completion = training.completedAt
    return {
        "id": training.id,
        "employeeId": training.employeeId,
        "title": training.title,
        "programTitle": training.title,
        "provider": training.provider,
        "completedAt": completion,
        "completionDate": completion,
        "expiryDate": training.expiryDate,
        "status": training.status,
        "notes": training.notes,
        "employee": serialize_employee(training.employee) if training.employee else None,
    }


def serialize_asset(asset: models.Asset) -> dict:
    return {
        "id": asset.id,
        "name": asset.name,
        "type": asset.type,
        "serialNumber": asset.serialNumber,
        "status": asset.status,
        "employeeId": asset.employeeId,
        "purchasedAt": asset.purchasedAt,
        "warrantyEnd": asset.warrantyEnd,
        "notes": asset.notes,
        "employee": serialize_employee(asset.employee) if asset.employee else None,
    }


def serialize_performance(review: models.PerformanceReview) -> dict:
    return {
        "id": review.id,
        "employeeId": review.employeeId,
        "periodStart": review.periodStart,
        "periodEnd": review.periodEnd,
        "rating": review.rating,
        "notes": review.notes,
        "employee": serialize_employee(review.employee) if review.employee else None,
    }


def serialize_salary_slip(slip: models.SalarySlip) -> dict:
    return {
        "id": slip.id,
        "periodId": slip.periodId,
        "employeeId": slip.employeeId,
        "basicSalary": slip.basicSalary,
        "allowances": slip.allowances,
        "workingDays": slip.workingDays,
        "totalWorkDays": slip.totalWorkDays,
        "absences": slip.absences,
        "halfDays": slip.halfDays,
        "grossSalary": slip.grossSalary,
        "totalDeductions": slip.totalDeductions,
        "netSalary": slip.netSalary,
        "paymentStatus": slip.paymentStatus,
        "paidAt": slip.paidAt,
        "slipUrl": slip.slipUrl,
        "period": {
            "id": slip.period.id,
            "month": slip.period.month,
            "year": slip.period.year,
            "status": slip.period.status,
        }
        if slip.period
        else None,
        "employee": serialize_employee(slip.employee) if slip.employee else None,
    }


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, utils.SECRET_KEY, algorithms=[utils.ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise credentials_exception
    return user


def require_roles(current_user: models.User, *roles: str) -> None:
    if roles and current_user.role not in roles:
        raise HTTPException(status_code=403, detail="Not authorized")


def get_employee_or_404(db: Session, emp_id: int) -> models.Employee:
    employee = db.query(models.Employee).filter(models.Employee.id == emp_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


def get_leave_or_404(db: Session, leave_id: int) -> models.LeaveRequest:
    leave = (
        db.query(models.LeaveRequest)
        .options(joinedload(models.LeaveRequest.type), joinedload(models.LeaveRequest.employee))
        .filter(models.LeaveRequest.id == leave_id)
        .first()
    )
    if not leave:
        raise HTTPException(status_code=404, detail="Leave not found")
    return leave


def save_employee_document(
    employee: models.Employee, field_name: str, file: UploadFile
) -> str:
    suffix = Path(file.filename or "").suffix
    unique_name = f"{uuid.uuid4()}{suffix}"
    destination = UPLOAD_DIR / unique_name
    with destination.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    setattr(employee, field_name, f"/uploads/{unique_name}")
    return getattr(employee, field_name)


def generate_employee_code(db: Session) -> str:
    last_employee = db.query(models.Employee).order_by(models.Employee.id.desc()).first()
    next_id = (last_employee.id + 1) if last_employee else 1
    return f"EMP-{str(next_id).zfill(4)}"


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "backend": "Python/FastAPI",
        "database": str(database.engine.url),
    }


@app.get("/api/auth/bootstrap-status")
def auth_bootstrap_status(db: Session = Depends(get_db)):
    count = db.query(models.User).count()
    return {"hasUsers": count > 0, "userCount": count}


@app.post("/api/auth/login", response_model=schemas.TokenResponse)
def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    identifier = request.emailOrUsername or request.username
    if not identifier:
        raise HTTPException(status_code=400, detail="Username or email is required")

    user = (
        db.query(models.User)
        .filter(or_(models.User.username == identifier, models.User.email == identifier))
        .first()
    )
    if not user or not utils.verify_password(request.password, user.passwordHash):
        raise HTTPException(status_code=400, detail="Invalid username or password")

    access_token = utils.create_access_token(data={"sub": user.username})
    return {"token": access_token, "user": user}


@app.get("/api/auth/me")
def auth_me(current_user: models.User = Depends(get_current_user)):
    return {"user": serialize_user(current_user)}


@app.post("/api/auth/register")
def register_user(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    linked_employee_id = payload.linkedEmployeeId
    if linked_employee_id is not None:
        employee = get_employee_or_404(db, linked_employee_id)
        if employee.user is not None:
            raise HTTPException(status_code=400, detail="Employee is already linked")
    else:
        auto_employee = models.Employee(
            name=payload.username,
            email=payload.email,
            phone=None,
            cnic=make_placeholder_cnic(),
            department="General",
            designation=payload.role,
            joiningDate=datetime.utcnow(),
            status="ACTIVE",
            baseSalary=0,
            allowance=0,
            workFormat="OFFICE",
            employmentType="FULL_TIME",
            employeeCode=generate_employee_code(db),
        )
        db.add(auto_employee)
        db.flush()
        linked_employee_id = auto_employee.id

    user = models.User(
        username=payload.username,
        email=payload.email,
        passwordHash=utils.get_password_hash(payload.password),
        role=payload.role,
        linkedEmployeeId=linked_employee_id,
        name=payload.username,
        jobTitle=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = utils.create_access_token(data={"sub": user.username})
    return {"token": access_token, "user": serialize_user(user)}


@app.get("/api/me/settings")
def get_my_settings(current_user: models.User = Depends(get_current_user)):
    return {
        "name": current_user.name,
        "jobTitle": current_user.jobTitle,
        "timeZone": current_user.timeZone,
        "theme": current_user.theme,
        "emailUpdates": current_user.emailUpdates,
        "taskReminders": current_user.taskReminders,
        "securityAlerts": current_user.securityAlerts,
    }


@app.put("/api/me/settings")
def update_my_settings(
    settings: schemas.SettingsUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for key, value in settings.dict(exclude_unset=True).items():
        setattr(current_user, key, value)
    db.commit()
    db.refresh(current_user)
    return {"success": True, "user": serialize_user(current_user)}


@app.get("/api/stats/me")
def get_my_stats(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if not current_user.linkedEmployeeId:
        return {"hasEmployeeRecord": False}

    employee = get_employee_or_404(db, current_user.linkedEmployeeId)
    today = datetime.utcnow().date()
    month_start = date(today.year, today.month, 1)
    next_month = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)

    tasks = (
        db.query(models.Task)
        .filter(models.Task.assigneeId == employee.id)
        .all()
    )
    projects_as_manager = (
        db.query(models.Project)
        .filter(models.Project.projectManagerId == employee.id)
        .all()
    )
    project_ids_as_contributor = {task.projectId for task in tasks if task.projectId}
    completed_projects = len([p for p in projects_as_manager if p.status == "completed"])

    leaves = (
        db.query(models.LeaveRequest)
        .options(joinedload(models.LeaveRequest.type))
        .filter(models.LeaveRequest.employeeId == employee.id)
        .all()
    )
    upcoming_approved = [
        {
            "id": leave.id,
            "startDate": leave.startDate,
            "endDate": leave.endDate,
            "typeName": leave.type.name if leave.type else "Leave",
        }
        for leave in leaves
        if leave.status == "approved" and leave.endDate and leave.endDate.date() >= today
    ]

    attendance_records = (
        db.query(models.Attendance)
        .filter(
            models.Attendance.employeeId == employee.id,
            models.Attendance.date >= start_of_day(month_start),
            models.Attendance.date < start_of_day(next_month),
        )
        .all()
    )
    present_days = len([item for item in attendance_records if item.status in {"PRESENT", "HALF_DAY"}])
    absent_days = len([item for item in attendance_records if item.status == "ABSENT"])
    leave_days = len([item for item in attendance_records if item.status == "LEAVE"])

    current_month_tasks = [
        task
        for task in tasks
        if task.createdAt and task.createdAt.date() >= month_start and task.createdAt.date() < next_month
    ]
    done_this_month = len([task for task in current_month_tasks if task.status == "done"])
    per_project = []
    for project_id in sorted(project_ids_as_contributor):
        project_tasks = [task for task in tasks if task.projectId == project_id]
        project = db.query(models.Project).filter(models.Project.id == project_id).first()
        per_project.append(
            {
                "projectId": project_id,
                "projectName": project.name if project else f"Project {project_id}",
                "total": len(project_tasks),
                "done": len([task for task in project_tasks if task.status == "done"]),
            }
        )

    daily_productivity = []
    for offset in range(6, -1, -1):
        current_day = today - timedelta(days=offset)
        count = len(
            [
                task
                for task in tasks
                if task.updatedAt
                and task.updatedAt.date() == current_day
                and task.status == "done"
            ]
        )
        daily_productivity.append(
            {
                "date": current_day.isoformat(),
                "label": current_day.strftime("%a"),
                "done": count,
            }
        )

    onboarding = [
        {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "datetime": task.dueDate or task.createdAt,
        }
        for task in sorted(tasks, key=lambda item: item.dueDate or item.createdAt or datetime.min)[:8]
    ]

    days_in_company = 0
    if employee.joiningDate:
        days_in_company = max(0, (today - employee.joiningDate.date()).days)

    payload = serialize_employee(employee)
    payload["daysInCompany"] = days_in_company

    return {
        "hasEmployeeRecord": True,
        "employee": payload,
        "tasks": {
            "total": len(tasks),
            "pending": len([task for task in tasks if task.status != "done"]),
            "onboarding": onboarding,
        },
        "projects": {
            "completed": completed_projects,
            "asManager": len(projects_as_manager),
            "asContributor": len(project_ids_as_contributor),
        },
        "leaves": {"upcomingApproved": upcoming_approved},
        "attendance": {
            "presentDays": present_days,
            "absentDays": absent_days,
            "leaveDays": leave_days,
        },
        "productivity": {
            "tasksThisMonth": len(current_month_tasks),
            "doneThisMonth": done_this_month,
            "perProject": per_project,
            "dailyProductivity": daily_productivity,
        },
    }


@app.get("/api/stats/overview")
def get_admin_overview_stats(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    require_roles(current_user, "Admin", "HR", "ProjectManager")

    total_employees = db.query(models.Employee).count()
    active_employees = db.query(models.Employee).filter(models.Employee.status == "ACTIVE").count()
    total_projects = db.query(models.Project).count()
    active_projects = db.query(models.Project).filter(models.Project.status == "active").count()
    completed_projects = db.query(models.Project).filter(models.Project.status == "completed").count()
    total_tasks = db.query(models.Task).count()
    todo_tasks = db.query(models.Task).filter(models.Task.status == "todo").count()
    in_progress_tasks = db.query(models.Task).filter(models.Task.status == "in_progress").count()
    done_tasks = db.query(models.Task).filter(models.Task.status == "done").count()

    return {
        "employees": {
            "total": total_employees,
            "active": active_employees,
            "inactive": total_employees - active_employees,
            "newLast30Days": db.query(models.Employee)
            .filter(models.Employee.joiningDate >= datetime.utcnow() - timedelta(days=30))
            .count(),
        },
        "projects": {
            "total": total_projects,
            "active": active_projects,
            "completed": completed_projects,
            "other": total_projects - active_projects - completed_projects,
        },
        "tasks": {
            "total": total_tasks,
            "todo": todo_tasks,
            "in_progress": in_progress_tasks,
            "done": done_tasks,
            "overdue": db.query(models.Task)
            .filter(models.Task.dueDate < datetime.utcnow(), models.Task.status != "done")
            .count(),
            "due_next_7_days": db.query(models.Task)
            .filter(
                models.Task.dueDate >= datetime.utcnow(),
                models.Task.dueDate <= datetime.utcnow() + timedelta(days=7),
                models.Task.status != "done",
            )
            .count(),
        },
    }


@app.get("/api/employees")
def get_employees(
    search: str = "",
    page: int = 1,
    pageSize: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Employee)
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                models.Employee.name.ilike(term),
                models.Employee.email.ilike(term),
                models.Employee.employeeCode.ilike(term),
                models.Employee.department.ilike(term),
            )
        )

    total_count = query.count()
    employees = (
        query.order_by(models.Employee.id.desc())
        .offset((page - 1) * pageSize)
        .limit(pageSize)
        .all()
    )
    return {
        "data": [serialize_employee(employee) for employee in employees],
        "totalCount": total_count,
        "page": page,
        "pageSize": pageSize,
        "totalPages": (total_count + pageSize - 1) // pageSize if pageSize else 1,
    }


@app.post("/api/employees")
def create_employee(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    employee = models.Employee(
        name=payload.get("name"),
        email=payload.get("email"),
        phone=payload.get("phone"),
        cnic=normalize_cnic(payload.get("cnic")),
        department=payload.get("department"),
        designation=payload.get("designation"),
        joiningDate=parse_iso_date(payload.get("joiningDate")),
        status=payload.get("status") or "ACTIVE",
        baseSalary=payload.get("baseSalary"),
        allowance=payload.get("allowance"),
        workFormat=payload.get("workFormat") or "OFFICE",
        employmentType=payload.get("employmentType") or "FULL_TIME",
        employeeCode=generate_employee_code(db),
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return serialize_employee(employee)


@app.put("/api/employees/{emp_id}")
def update_employee(
    emp_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    employee = get_employee_or_404(db, emp_id)
    for field in [
        "name",
        "email",
        "phone",
        "department",
        "designation",
        "status",
        "baseSalary",
        "allowance",
        "workFormat",
        "employmentType",
    ]:
        if field in payload:
            setattr(employee, field, payload.get(field))
    if "cnic" in payload:
        employee.cnic = normalize_cnic(payload.get("cnic"))
    if "joiningDate" in payload:
        employee.joiningDate = parse_iso_date(payload.get("joiningDate"))
    db.commit()
    db.refresh(employee)
    return serialize_employee(employee)


@app.delete("/api/employees/{emp_id}")
def delete_employee(
    emp_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    employee = get_employee_or_404(db, emp_id)
    db.delete(employee)
    db.commit()
    return {"message": "Employee deleted successfully"}


@app.post("/api/employees/{emp_id}/cv")
async def upload_cv(
    emp_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    employee = get_employee_or_404(db, emp_id)
    save_employee_document(employee, "cvUrl", file)
    db.commit()
    return {"message": "CV uploaded successfully", "path": employee.cvUrl}


@app.post("/api/employees/{emp_id}/id-document")
async def upload_id_document(
    emp_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    employee = get_employee_or_404(db, emp_id)
    save_employee_document(employee, "idDocumentUrl", file)
    db.commit()
    return {"message": "ID document uploaded successfully", "path": employee.idDocumentUrl}


@app.post("/api/employees/{emp_id}/contract")
async def upload_contract(
    emp_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    employee = get_employee_or_404(db, emp_id)
    save_employee_document(employee, "contractUrl", file)
    db.commit()
    return {"message": "Contract uploaded successfully", "path": employee.contractUrl}


@app.post("/api/employees/{emp_id}/offer-letter")
async def upload_offer_letter(
    emp_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    employee = get_employee_or_404(db, emp_id)
    save_employee_document(employee, "offerLetterUrl", file)
    db.commit()
    return {"message": "Offer letter uploaded successfully", "path": employee.offerLetterUrl}


@app.delete("/api/employees/{emp_id}/cv")
def delete_cv(
    emp_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    employee = get_employee_or_404(db, emp_id)
    employee.cvUrl = None
    db.commit()
    return {"message": "CV removed"}


@app.delete("/api/employees/{emp_id}/id-document")
def delete_id_document(
    emp_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    employee = get_employee_or_404(db, emp_id)
    employee.idDocumentUrl = None
    db.commit()
    return {"message": "ID document removed"}


@app.delete("/api/employees/{emp_id}/contract")
def delete_contract(
    emp_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    employee = get_employee_or_404(db, emp_id)
    employee.contractUrl = None
    db.commit()
    return {"message": "Contract removed"}


@app.delete("/api/employees/{emp_id}/offer-letter")
def delete_offer_letter(
    emp_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    employee = get_employee_or_404(db, emp_id)
    employee.offerLetterUrl = None
    db.commit()
    return {"message": "Offer letter removed"}


@app.get("/api/users")
def get_users(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    users = db.query(models.User).order_by(models.User.id.desc()).all()
    return [serialize_user(user) for user in users]


@app.put("/api/users/{user_id}/link-employee")
def link_user_employee(
    user_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    linked_employee_id = payload.get("linkedEmployeeId")
    if linked_employee_id is not None:
        employee = get_employee_or_404(db, int(linked_employee_id))
        existing = (
            db.query(models.User)
            .filter(models.User.linkedEmployeeId == linked_employee_id, models.User.id != user_id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Employee already linked to another user")
        user.linkedEmployeeId = employee.id
    else:
        user.linkedEmployeeId = None

    db.commit()
    db.refresh(user)
    return serialize_user(user)


@app.delete("/api/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


@app.get("/api/vacancies")
def get_vacancies(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    return [serialize_vacancy(item) for item in db.query(models.Vacancy).order_by(models.Vacancy.id.desc()).all()]


@app.post("/api/vacancies")
def create_vacancy(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    vacancy = models.Vacancy(
        title=payload.get("title"),
        department=payload.get("department"),
        location=payload.get("location"),
        employmentType=payload.get("employmentType") or "Full-time",
        status=payload.get("status") or "Open",
        postedDate=parse_iso_date(payload.get("postedDate")),
        closingDate=parse_iso_date(payload.get("closingDate")),
        description=payload.get("description"),
    )
    db.add(vacancy)
    db.commit()
    db.refresh(vacancy)
    return serialize_vacancy(vacancy)


@app.put("/api/vacancies/{vacancy_id}")
def update_vacancy(
    vacancy_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    vacancy = db.query(models.Vacancy).filter(models.Vacancy.id == vacancy_id).first()
    if not vacancy:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    for field in ["title", "department", "location", "employmentType", "status", "description"]:
        if field in payload:
            setattr(vacancy, field, payload.get(field))
    if "postedDate" in payload:
        vacancy.postedDate = parse_iso_date(payload.get("postedDate"))
    if "closingDate" in payload:
        vacancy.closingDate = parse_iso_date(payload.get("closingDate"))
    db.commit()
    db.refresh(vacancy)
    return serialize_vacancy(vacancy)


@app.delete("/api/vacancies/{vacancy_id}")
def delete_vacancy(
    vacancy_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    vacancy = db.query(models.Vacancy).filter(models.Vacancy.id == vacancy_id).first()
    if not vacancy:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    db.delete(vacancy)
    db.commit()
    return {"message": "Vacancy deleted"}


@app.get("/api/applicants")
def get_applicants(
    vacancyId: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Applicant).options(joinedload(models.Applicant.vacancy))
    if vacancyId:
        query = query.filter(models.Applicant.vacancyId == vacancyId)
    return [serialize_applicant(item) for item in query.order_by(models.Applicant.id.desc()).all()]


@app.post("/api/applicants")
def create_applicant(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    applicant = models.Applicant(
        vacancyId=int(payload.get("vacancyId")),
        name=payload.get("name"),
        email=payload.get("email"),
        phone=payload.get("phone"),
        notes=payload.get("notes"),
        status=payload.get("status") or "Applied",
    )
    db.add(applicant)
    db.commit()
    db.refresh(applicant)
    applicant = (
        db.query(models.Applicant)
        .options(joinedload(models.Applicant.vacancy))
        .filter(models.Applicant.id == applicant.id)
        .first()
    )
    return serialize_applicant(applicant)


@app.put("/api/applicants/{applicant_id}")
def update_applicant(
    applicant_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    applicant = db.query(models.Applicant).filter(models.Applicant.id == applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
    for field in ["status", "notes", "name", "email", "phone"]:
        if field in payload:
            setattr(applicant, field, payload.get(field))
    db.commit()
    db.refresh(applicant)
    applicant = (
        db.query(models.Applicant)
        .options(joinedload(models.Applicant.vacancy))
        .filter(models.Applicant.id == applicant.id)
        .first()
    )
    return serialize_applicant(applicant)


@app.delete("/api/applicants/{applicant_id}")
def delete_applicant(
    applicant_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    applicant = db.query(models.Applicant).filter(models.Applicant.id == applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
    db.delete(applicant)
    db.commit()
    return {"message": "Applicant deleted"}


@app.get("/api/trainings")
def get_trainings(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    trainings = (
        db.query(models.EmployeeTraining)
        .options(joinedload(models.EmployeeTraining.employee))
        .order_by(models.EmployeeTraining.id.desc())
        .all()
    )
    return [serialize_training(item) for item in trainings]


@app.get("/api/trainings/me")
def get_my_trainings(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if not current_user.linkedEmployeeId:
        return []
    trainings = (
        db.query(models.EmployeeTraining)
        .options(joinedload(models.EmployeeTraining.employee))
        .filter(models.EmployeeTraining.employeeId == current_user.linkedEmployeeId)
        .order_by(models.EmployeeTraining.id.desc())
        .all()
    )
    return [serialize_training(item) for item in trainings]


@app.post("/api/trainings")
def create_training(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    training = models.EmployeeTraining(
        employeeId=int(payload.get("employeeId")),
        title=payload.get("title"),
        provider=payload.get("provider"),
        completedAt=parse_iso_date(payload.get("completedAt")),
        expiryDate=parse_iso_date(payload.get("expiryDate")),
        status=payload.get("status") or "Enrolled",
        notes=payload.get("notes"),
    )
    db.add(training)
    db.commit()
    db.refresh(training)
    training = (
        db.query(models.EmployeeTraining)
        .options(joinedload(models.EmployeeTraining.employee))
        .filter(models.EmployeeTraining.id == training.id)
        .first()
    )
    return serialize_training(training)


@app.put("/api/trainings/{training_id}")
def update_training(
    training_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    training = db.query(models.EmployeeTraining).filter(models.EmployeeTraining.id == training_id).first()
    if not training:
        raise HTTPException(status_code=404, detail="Training not found")
    for field in ["title", "provider", "status", "notes"]:
        if field in payload:
            setattr(training, field, payload.get(field))
    if "employeeId" in payload:
        training.employeeId = int(payload.get("employeeId"))
    if "completedAt" in payload:
        training.completedAt = parse_iso_date(payload.get("completedAt"))
    if "expiryDate" in payload:
        training.expiryDate = parse_iso_date(payload.get("expiryDate"))
    db.commit()
    db.refresh(training)
    training = (
        db.query(models.EmployeeTraining)
        .options(joinedload(models.EmployeeTraining.employee))
        .filter(models.EmployeeTraining.id == training.id)
        .first()
    )
    return serialize_training(training)


@app.delete("/api/trainings/{training_id}")
def delete_training(
    training_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    training = db.query(models.EmployeeTraining).filter(models.EmployeeTraining.id == training_id).first()
    if not training:
        raise HTTPException(status_code=404, detail="Training not found")
    db.delete(training)
    db.commit()
    return {"message": "Training deleted"}


@app.get("/api/projects")
def get_projects(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    projects = (
        db.query(models.Project)
        .options(joinedload(models.Project.projectManager), joinedload(models.Project.tasks))
        .order_by(models.Project.id.desc())
        .all()
    )
    return [serialize_project(item, task_count=len(item.tasks or [])) for item in projects]


@app.post("/api/projects")
def create_project(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = models.Project(
        name=payload.get("name"),
        description=payload.get("description"),
        client=payload.get("client"),
        startDate=parse_iso_date(payload.get("startDate")),
        endDate=parse_iso_date(payload.get("endDate")),
        status=payload.get("status") or "active",
        projectManagerId=int(payload.get("projectManagerId")),
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    project = (
        db.query(models.Project)
        .options(joinedload(models.Project.projectManager), joinedload(models.Project.tasks))
        .filter(models.Project.id == project.id)
        .first()
    )
    return serialize_project(project, task_count=len(project.tasks or []))


@app.put("/api/projects/{project_id}")
def update_project(
    project_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    for field in ["name", "description", "client", "status"]:
        if field in payload:
            setattr(project, field, payload.get(field))
    if "projectManagerId" in payload and payload.get("projectManagerId") is not None:
        project.projectManagerId = int(payload.get("projectManagerId"))
    if "startDate" in payload:
        project.startDate = parse_iso_date(payload.get("startDate"))
    if "endDate" in payload:
        project.endDate = parse_iso_date(payload.get("endDate"))
    db.commit()
    db.refresh(project)
    project = (
        db.query(models.Project)
        .options(joinedload(models.Project.projectManager), joinedload(models.Project.tasks))
        .filter(models.Project.id == project.id)
        .first()
    )
    return serialize_project(project, task_count=len(project.tasks or []))


@app.delete("/api/projects/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"message": "Project deleted"}


@app.get("/api/tasks")
def get_tasks(
    projectId: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Task).options(
        joinedload(models.Task.project),
        joinedload(models.Task.assignee),
    )
    if projectId:
        query = query.filter(models.Task.projectId == projectId)
    tasks = query.order_by(models.Task.id.desc()).all()
    return [serialize_task(item) for item in tasks]


@app.get("/api/admin/tasks")
def get_admin_tasks(
    status: Optional[str] = None,
    assigneeId: Optional[int] = None,
    projectId: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Task).options(
        joinedload(models.Task.project),
        joinedload(models.Task.assignee),
    )
    if status:
        query = query.filter(models.Task.status == status)
    if assigneeId:
        query = query.filter(models.Task.assigneeId == assigneeId)
    if projectId:
        query = query.filter(models.Task.projectId == projectId)
    return [serialize_task(item) for item in query.order_by(models.Task.id.desc()).all()]


@app.post("/api/tasks")
def create_task(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = models.Task(
        title=payload.get("title"),
        description=payload.get("description"),
        projectId=int(payload.get("projectId")),
        assigneeId=int(payload.get("assigneeId")),
        priority=payload.get("priority") or "medium",
        status=payload.get("status") or "todo",
        dueDate=parse_iso_date(payload.get("dueDate")),
        estimatedHours=payload.get("estimatedHours"),
        actualHours=payload.get("actualHours"),
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    task = (
        db.query(models.Task)
        .options(joinedload(models.Task.project), joinedload(models.Task.assignee))
        .filter(models.Task.id == task.id)
        .first()
    )
    return serialize_task(task)


@app.put("/api/tasks/{task_id}")
def update_task(
    task_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for field in ["title", "description", "priority", "status", "estimatedHours", "actualHours"]:
        if field in payload:
            setattr(task, field, payload.get(field))
    if "projectId" in payload and payload.get("projectId") is not None:
        task.projectId = int(payload.get("projectId"))
    if "assigneeId" in payload and payload.get("assigneeId") is not None:
        task.assigneeId = int(payload.get("assigneeId"))
    if "dueDate" in payload:
        task.dueDate = parse_iso_date(payload.get("dueDate"))
    task.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(task)
    task = (
        db.query(models.Task)
        .options(joinedload(models.Task.project), joinedload(models.Task.assignee))
        .filter(models.Task.id == task.id)
        .first()
    )
    return serialize_task(task)


@app.delete("/api/tasks/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"message": "Task deleted"}


@app.get("/api/leave-types")
def get_leave_types(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    ensure_leave_types(db)
    return [serialize_leave_type(item) for item in db.query(models.LeaveType).order_by(models.LeaveType.id.asc()).all()]


@app.get("/api/leaves/me")
def get_my_leaves(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    ensure_leave_types(db)
    if not current_user.linkedEmployeeId:
        return []
    leaves = (
        db.query(models.LeaveRequest)
        .options(joinedload(models.LeaveRequest.type), joinedload(models.LeaveRequest.employee))
        .filter(models.LeaveRequest.employeeId == current_user.linkedEmployeeId)
        .order_by(models.LeaveRequest.id.desc())
        .all()
    )
    return [serialize_leave(item) for item in leaves]


@app.post("/api/leaves")
def request_leave(
    payload: dict,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_leave_types(db)
    if not current_user.linkedEmployeeId:
        raise HTTPException(status_code=400, detail="Not an employee")
    leave = models.LeaveRequest(
        employeeId=current_user.linkedEmployeeId,
        typeId=int(payload.get("typeId")),
        startDate=parse_iso_date(payload.get("startDate")),
        endDate=parse_iso_date(payload.get("endDate")),
        reason=payload.get("reason"),
        status="pending",
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)
    leave = get_leave_or_404(db, leave.id)
    return serialize_leave(leave)


@app.put("/api/leaves/{leave_id}")
def update_leave(
    leave_id: int,
    payload: dict,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    leave = get_leave_or_404(db, leave_id)
    if leave.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending requests can be edited")
    if current_user.role == "Employee" and leave.employeeId != current_user.linkedEmployeeId:
        raise HTTPException(status_code=403, detail="Not authorized")
    leave.typeId = int(payload.get("typeId"))
    leave.startDate = parse_iso_date(payload.get("startDate"))
    leave.endDate = parse_iso_date(payload.get("endDate"))
    leave.reason = payload.get("reason")
    db.commit()
    db.refresh(leave)
    leave = get_leave_or_404(db, leave.id)
    return serialize_leave(leave)


@app.delete("/api/leaves/{leave_id}")
def delete_leave(
    leave_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    leave = get_leave_or_404(db, leave_id)
    if current_user.role == "Employee" and leave.employeeId != current_user.linkedEmployeeId:
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(leave)
    db.commit()
    return {"message": "Leave request deleted"}


@app.get("/api/leaves")
def get_all_leaves(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ensure_leave_types(db)
    query = db.query(models.LeaveRequest).options(
        joinedload(models.LeaveRequest.type),
        joinedload(models.LeaveRequest.employee),
    )
    if status:
        query = query.filter(models.LeaveRequest.status == status)
    return [serialize_leave(item) for item in query.order_by(models.LeaveRequest.id.desc()).all()]


@app.get("/api/leaves/summary")
def get_leave_summary(
    from_date: str = Query(..., alias="from"),
    to_date: str = Query(..., alias="to"),
    status_filter: Optional[str] = Query(None, alias="status"),
    employeeId: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    start_date = parse_date_only(from_date)
    end_date = parse_date_only(to_date)
    query = db.query(models.LeaveRequest).options(
        joinedload(models.LeaveRequest.type),
        joinedload(models.LeaveRequest.employee),
    ).filter(
        models.LeaveRequest.startDate <= end_of_day(end_date),
        models.LeaveRequest.endDate >= start_of_day(start_date),
    )
    if status_filter:
        query = query.filter(models.LeaveRequest.status == status_filter)
    if employeeId:
        query = query.filter(models.LeaveRequest.employeeId == employeeId)
    return [serialize_leave(item) for item in query.order_by(models.LeaveRequest.id.desc()).all()]


@app.put("/api/leaves/{leave_id}/status")
def update_leave_status(
    leave_id: int,
    status_update: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    leave = get_leave_or_404(db, leave_id)
    leave.status = status_update.get("status")
    db.commit()
    db.refresh(leave)
    leave = get_leave_or_404(db, leave.id)
    return serialize_leave(leave)


@app.get("/api/attendance")
def get_all_attendance(
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    employeeId: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Attendance).options(joinedload(models.Attendance.employee))
    if from_date:
        query = query.filter(models.Attendance.date >= start_of_day(parse_date_only(from_date)))
    if to_date:
        query = query.filter(models.Attendance.date <= end_of_day(parse_date_only(to_date)))
    if employeeId:
        query = query.filter(models.Attendance.employeeId == employeeId)
    records = query.order_by(models.Attendance.date.desc()).all()
    return [serialize_attendance(item) for item in records]


@app.get("/api/attendance/me")
def get_my_attendance(
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.linkedEmployeeId:
        return []
    query = (
        db.query(models.Attendance)
        .options(joinedload(models.Attendance.employee))
        .filter(models.Attendance.employeeId == current_user.linkedEmployeeId)
    )
    if from_date:
        query = query.filter(models.Attendance.date >= start_of_day(parse_date_only(from_date)))
    if to_date:
        query = query.filter(models.Attendance.date <= end_of_day(parse_date_only(to_date)))
    return [serialize_attendance(item) for item in query.order_by(models.Attendance.date.desc()).all()]


@app.post("/api/attendance/me")
def create_or_update_my_attendance(
    payload: dict,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.linkedEmployeeId:
        raise HTTPException(status_code=400, detail="User not linked to employee")

    record_date = parse_date_only(payload.get("date")) or datetime.utcnow().date()
    date_start = start_of_day(record_date)
    date_end = end_of_day(record_date)
    record = (
        db.query(models.Attendance)
        .filter(
            models.Attendance.employeeId == current_user.linkedEmployeeId,
            models.Attendance.date >= date_start,
            models.Attendance.date <= date_end,
        )
        .first()
    )

    check_in = parse_iso_date(payload.get("checkIn"))
    check_out = parse_iso_date(payload.get("checkOut"))
    status_value = "ABSENT" if not check_in and not check_out else "PRESENT"
    total_hours = None
    if check_in and check_out:
        total_hours = round((check_out - check_in).total_seconds() / 3600, 2)
        if total_hours < 4:
            status_value = "HALF_DAY"

    is_late = bool(check_in and check_in.time() > time(9, 15))
    is_half_day = status_value == "HALF_DAY"
    is_overtime = bool(total_hours and total_hours > 8)

    if not record:
        record = models.Attendance(
            employeeId=current_user.linkedEmployeeId,
            date=date_start,
        )
        db.add(record)

    record.checkIn = check_in
    record.checkOut = check_out
    record.totalHours = total_hours
    record.remarks = payload.get("remarks")
    record.status = status_value
    record.isLate = is_late
    record.isHalfDay = is_half_day
    record.isOvertime = is_overtime
    db.commit()
    db.refresh(record)
    record = (
        db.query(models.Attendance)
        .options(joinedload(models.Attendance.employee))
        .filter(models.Attendance.id == record.id)
        .first()
    )
    return serialize_attendance(record)


@app.post("/api/attendance/mark")
def mark_attendance(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.linkedEmployeeId:
        raise HTTPException(status_code=400, detail="User not linked to employee")

    today = datetime.utcnow().date()
    date_start = start_of_day(today)
    date_end = end_of_day(today)
    record = (
        db.query(models.Attendance)
        .filter(
            models.Attendance.employeeId == current_user.linkedEmployeeId,
            models.Attendance.date >= date_start,
            models.Attendance.date <= date_end,
        )
        .first()
    )

    now = datetime.utcnow()
    if record:
        if record.checkOut:
            return {"message": "Already checked out for today"}
        record.checkOut = now
        diff = record.checkOut - record.checkIn
        record.totalHours = round(diff.total_seconds() / 3600, 2)
        record.status = "HALF_DAY" if record.totalHours < 4 else "PRESENT"
        record.isHalfDay = record.totalHours < 4
        record.isOvertime = record.totalHours > 8
        db.commit()
        return {"message": "Checked out successfully", "time": record.checkOut}

    record = models.Attendance(
        employeeId=current_user.linkedEmployeeId,
        date=date_start,
        checkIn=now,
        status="PRESENT",
        isLate=now.time() > time(9, 15),
    )
    db.add(record)
    db.commit()
    return {"message": "Checked in successfully", "time": record.checkIn}


@app.get("/api/attendance/export")
def export_attendance(
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    employeeId: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Export attendance records to Excel"""
    require_roles(current_user, "Admin", "HR")
    
    query = db.query(models.Attendance).options(joinedload(models.Attendance.employee))
    if from_date:
        query = query.filter(models.Attendance.date >= start_of_day(parse_date_only(from_date)))
    if to_date:
        query = query.filter(models.Attendance.date <= end_of_day(parse_date_only(to_date)))
    if employeeId:
        query = query.filter(models.Attendance.employeeId == employeeId)
    
    records = query.order_by(models.Attendance.date.desc()).all()
    
    # Create Excel workbook
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Attendance Report"
    
    # Headers
    headers = [
        "Date",
        "Employee Code",
        "Employee Name",
        "Department",
        "Check In",
        "Check Out",
        "Total Hours",
        "Status",
        "Late",
        "Half Day",
        "Overtime",
        "Remarks"
    ]
    ws.append(headers)
    
    # Style header row
    for cell in ws[1]:
        cell.font = openpyxl.styles.Font(bold=True)
        cell.fill = openpyxl.styles.PatternFill(start_color="366092", end_color="366092", fill_type="solid")
        cell.font = openpyxl.styles.Font(bold=True, color="FFFFFF")
    
    # Add data rows
    for record in records:
        emp = record.employee
        ws.append([
            record.date.strftime("%Y-%m-%d") if record.date else "",
            emp.employeeCode if emp else "",
            emp.name if emp else "",
            emp.department if emp else "",
            record.checkIn.strftime("%H:%M:%S") if record.checkIn else "",
            record.checkOut.strftime("%H:%M:%S") if record.checkOut else "",
            f"{record.totalHours:.2f}" if record.totalHours else "",
            record.status or "",
            "Yes" if record.isLate else "No",
            "Yes" if record.isHalfDay else "No",
            "Yes" if record.isOvertime else "No",
            record.remarks or ""
        ])
    
    # Auto-adjust column widths
    for column in ws.columns:
        max_length = 0
        column_letter = column[0].column_letter
        for cell in column:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        adjusted_width = min(max_length + 2, 50)
        ws.column_dimensions[column_letter].width = adjusted_width
    
    # Save to BytesIO
    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    
    # Generate filename
    from_str = from_date or "all"
    to_str = to_date or "all"
    filename = f"Attendance_Report_{from_str}_to_{to_str}.xlsx"
    
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@app.get("/api/assets")
def get_assets(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    assets = (
        db.query(models.Asset)
        .options(joinedload(models.Asset.employee))
        .order_by(models.Asset.id.desc())
        .all()
    )
    return [serialize_asset(item) for item in assets]


@app.post("/api/assets")
def create_asset(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    asset = models.Asset(
        name=payload.get("name"),
        type=payload.get("type"),
        serialNumber=payload.get("serialNumber"),
        status=payload.get("status") or "Available",
        employeeId=int(payload.get("employeeId")) if payload.get("employeeId") else None,
        notes=payload.get("notes"),
        purchasedAt=parse_iso_date(payload.get("purchasedAt")),
        warrantyEnd=parse_iso_date(payload.get("warrantyEnd")),
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    asset = (
        db.query(models.Asset)
        .options(joinedload(models.Asset.employee))
        .filter(models.Asset.id == asset.id)
        .first()
    )
    return serialize_asset(asset)


@app.put("/api/assets/{asset_id}")
def update_asset(
    asset_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    for field in ["name", "type", "serialNumber", "status", "notes"]:
        if field in payload:
            setattr(asset, field, payload.get(field))
    if "employeeId" in payload:
        asset.employeeId = int(payload.get("employeeId")) if payload.get("employeeId") else None
    if "purchasedAt" in payload:
        asset.purchasedAt = parse_iso_date(payload.get("purchasedAt"))
    if "warrantyEnd" in payload:
        asset.warrantyEnd = parse_iso_date(payload.get("warrantyEnd"))
    db.commit()
    db.refresh(asset)
    asset = (
        db.query(models.Asset)
        .options(joinedload(models.Asset.employee))
        .filter(models.Asset.id == asset.id)
        .first()
    )
    return serialize_asset(asset)


@app.delete("/api/assets/{asset_id}")
def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    db.delete(asset)
    db.commit()
    return {"message": "Asset deleted"}


@app.get("/api/performance")
def get_performance_reviews(
    employeeId: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.PerformanceReview).options(joinedload(models.PerformanceReview.employee))
    if employeeId:
        query = query.filter(models.PerformanceReview.employeeId == employeeId)
    return [serialize_performance(item) for item in query.order_by(models.PerformanceReview.id.desc()).all()]


@app.get("/api/performance/{employee_id}")
def get_performance_reviews_for_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    reviews = (
        db.query(models.PerformanceReview)
        .options(joinedload(models.PerformanceReview.employee))
        .filter(models.PerformanceReview.employeeId == employee_id)
        .order_by(models.PerformanceReview.id.desc())
        .all()
    )
    return [serialize_performance(item) for item in reviews]


@app.post("/api/performance")
def create_performance_review(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    review = models.PerformanceReview(
        employeeId=int(payload.get("employeeId")),
        periodStart=parse_iso_date(payload.get("periodStart")),
        periodEnd=parse_iso_date(payload.get("periodEnd")),
        rating=int(payload.get("rating")),
        notes=payload.get("notes"),
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    review = (
        db.query(models.PerformanceReview)
        .options(joinedload(models.PerformanceReview.employee))
        .filter(models.PerformanceReview.id == review.id)
        .first()
    )
    return serialize_performance(review)


@app.post("/api/payroll/generate")
def generate_payroll(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    month = int(payload.get("month"))
    year = int(payload.get("year"))
    period = (
        db.query(models.PayrollPeriod)
        .filter(models.PayrollPeriod.month == month, models.PayrollPeriod.year == year)
        .first()
    )
    if not period:
        start_date = datetime(year, month, 1)
        last_day = (start_date.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
        period = models.PayrollPeriod(
            month=month,
            year=year,
            startDate=start_date,
            endDate=last_day,
            status="OPEN",
        )
        db.add(period)
        db.commit()
        db.refresh(period)

    employees = db.query(models.Employee).filter(models.Employee.status == "ACTIVE").all()
    created_count = 0
    
    # Calculate total working days in this period (approx 22 for a standard month)
    # but we can use 22 as a base for simplicity unless calculated dynamically.
    base_working_days = 22
    
    for employee in employees:
        existing = (
            db.query(models.SalarySlip)
            .filter(models.SalarySlip.periodId == period.id, models.SalarySlip.employeeId == employee.id)
            .first()
        )
        if existing:
            continue
            
        basic = employee.baseSalary or 0
        allowance = employee.allowance or 0
        gross_monthly = basic + allowance
        per_day_salary = gross_monthly / base_working_days
        
        # Calculate attendance
        attendances = db.query(models.Attendance).filter(
            models.Attendance.employeeId == employee.id,
            models.Attendance.date >= period.startDate,
            models.Attendance.date <= period.endDate
        ).all()
        
        present_days = sum(1 for a in attendances if a.status == "PRESENT")
        half_days = sum(1 for a in attendances if a.status == "HALF_DAY")
        absent_days = sum(1 for a in attendances if a.status == "ABSENT")
        
        # Simple deduction logic:
        # Every unrecorded day out of the 22 working days is considered an absence (if they didn't clock in and it's not a leave).
        # To be safe, we just use the explicitly marked absences + unrecorded days up to 22.
        recorded_days = present_days + half_days + absent_days
        unrecorded = max(0, base_working_days - recorded_days)
        total_absences = absent_days + unrecorded
        
        # Deductions = (total_absences * per_day_salary) + (half_days * (per_day_salary / 2))
        deductions = round((total_absences * per_day_salary) + (half_days * (per_day_salary / 2)), 2)
        
        # Ensure we don't deduct more than gross
        deductions = min(deductions, gross_monthly)
        
        net_salary = round(gross_monthly - deductions, 2)
        
        slip = models.SalarySlip(
            periodId=period.id,
            employeeId=employee.id,
            basicSalary=basic,
            allowances=allowance,
            workingDays=base_working_days - total_absences - (half_days * 0.5),
            totalWorkDays=base_working_days,
            absences=total_absences,
            halfDays=half_days,
            grossSalary=gross_monthly,
            totalDeductions=deductions,
            netSalary=net_salary,
            paymentStatus="PENDING",
        )
        db.add(slip)
        created_count += 1

    db.commit()
    return {"message": f"Generated {created_count} slips for {month}/{year}"}


@app.get("/api/payroll/{month}/{year}")
def get_payroll_for_period(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    slips = (
        db.query(models.SalarySlip)
        .options(joinedload(models.SalarySlip.employee), joinedload(models.SalarySlip.period))
        .join(models.PayrollPeriod, models.SalarySlip.periodId == models.PayrollPeriod.id)
        .filter(models.PayrollPeriod.month == month, models.PayrollPeriod.year == year)
        .order_by(models.SalarySlip.id.desc())
        .all()
    )
    return [serialize_salary_slip(item) for item in slips]


@app.put("/api/payroll/pay/{slip_id}")
def mark_slip_paid(
    slip_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    slip = db.query(models.SalarySlip).filter(models.SalarySlip.id == slip_id).first()
    if not slip:
        raise HTTPException(status_code=404, detail="Slip not found")
    slip.paymentStatus = "PAID"
    slip.paidAt = datetime.utcnow()
    db.commit()
    return {"message": "Marked as paid"}


@app.get("/api/payroll/me")
def get_my_payroll(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if not current_user.linkedEmployeeId:
        raise HTTPException(status_code=400, detail="User not linked to employee")
    slips = (
        db.query(models.SalarySlip)
        .options(joinedload(models.SalarySlip.employee), joinedload(models.SalarySlip.period))
        .filter(models.SalarySlip.employeeId == current_user.linkedEmployeeId)
        .order_by(models.SalarySlip.id.desc())
        .all()
    )
    return [serialize_salary_slip(item) for item in slips]


@app.get("/api/payroll/export/{month}/{year}")
def export_payroll(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role not in ["Admin", "HR"]:
        raise HTTPException(status_code=403, detail="Not authorized to export payroll")

    slips = (
        db.query(models.SalarySlip)
        .options(joinedload(models.SalarySlip.employee), joinedload(models.SalarySlip.period))
        .join(models.PayrollPeriod, models.SalarySlip.periodId == models.PayrollPeriod.id)
        .filter(models.PayrollPeriod.month == month, models.PayrollPeriod.year == year)
        .order_by(models.SalarySlip.id.desc())
        .all()
    )

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = f"Payroll_{month}_{year}"

    # Headers
    headers = [
        "Slip ID",
        "Employee ID",
        "Employee Name",
        "Department",
        "Base Salary",
        "Allowances",
        "Gross Salary",
        "Total Absences",
        "Half Days",
        "Deductions",
        "Net Salary",
        "Payment Status",
    ]
    ws.append(headers)

    # Data
    for slip in slips:
        ws.append([
            slip.id,
            slip.employeeId,
            slip.employee.name if slip.employee else "N/A",
            slip.employee.department if slip.employee else "N/A",
            slip.basicSalary,
            slip.allowances,
            slip.grossSalary,
            slip.absences,
            slip.halfDays,
            slip.totalDeductions,
            slip.netSalary,
            slip.paymentStatus,
        ])

    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)

    filename = f"Payroll_{month}_{year}.xlsx"
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"'
    }
    return StreamingResponse(stream, headers=headers, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")


@app.get("/api/payroll/slip-pdf/{slip_id}")
def download_salary_slip_pdf(
    slip_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    slip = (
        db.query(models.SalarySlip)
        .options(joinedload(models.SalarySlip.employee), joinedload(models.SalarySlip.period))
        .filter(models.SalarySlip.id == slip_id)
        .first()
    )
    if not slip:
        raise HTTPException(status_code=404, detail="Slip not found")

    # Employees can only download their own slip
    if current_user.role == "Employee" and current_user.linkedEmployeeId != slip.employeeId:
        raise HTTPException(status_code=403, detail="Access denied")

    emp = slip.employee
    period = slip.period

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=20*mm, bottomMargin=20*mm)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle('SlipTitle', parent=styles['Title'], fontSize=20, spaceAfter=6)
    subtitle_style = ParagraphStyle('SlipSub', parent=styles['Normal'], fontSize=10, textColor=colors.grey, spaceAfter=20)
    section_style = ParagraphStyle('Section', parent=styles['Heading3'], fontSize=12, spaceAfter=8, spaceBefore=16)
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.grey, alignment=1)

    elements = []

    # Header
    elements.append(Paragraph("SALARY SLIP", title_style))
    month_name = datetime(2000, period.month, 1).strftime('%B') if period else 'N/A'
    elements.append(Paragraph(f"Period: {month_name} {period.year if period else ''}", subtitle_style))

    # Employee Info
    elements.append(Paragraph("Employee Details", section_style))
    emp_data = [
        ["Employee Name", emp.name if emp else "N/A"],
        ["Employee Code", emp.employeeCode if emp else "N/A"],
        ["Department", emp.department if emp else "N/A"],
        ["Designation", emp.designation if emp else "N/A"],
        ["CNIC", emp.cnic if emp and emp.cnic else "N/A"],
    ]
    emp_table = Table(emp_data, colWidths=[150, 300])
    emp_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ('BACKGROUND', (0, 0), (0, -1), colors.Color(0.95, 0.95, 0.95)),
    ]))
    elements.append(emp_table)

    # Salary Breakdown
    elements.append(Paragraph("Salary Breakdown", section_style))
    salary_data = [
        ["Description", "Amount (Rs.)"],
        ["Basic Salary", f"{slip.basicSalary:,.2f}"],
        ["Allowances", f"{slip.allowances:,.2f}"],
        ["Gross Salary", f"{slip.grossSalary:,.2f}"],
        ["", ""],
        ["Working Days", str(slip.workingDays or 0)],
        ["Total Work Days", str(slip.totalWorkDays or 0)],
        ["Absences", str(slip.absences or 0)],
        ["Half Days", str(slip.halfDays or 0)],
        ["", ""],
        ["Total Deductions", f"-{slip.totalDeductions:,.2f}"],
        ["Net Salary Payable", f"{slip.netSalary:,.2f}"],
    ]
    sal_table = Table(salary_data, colWidths=[300, 150])
    sal_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ('BACKGROUND', (0, 0), (-1, 0), colors.Color(0.2, 0.2, 0.3)),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, -1), (-1, -1), colors.Color(0.9, 0.95, 0.9)),
        ('TEXTCOLOR', (0, -2), (-1, -2), colors.red),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
    ]))
    elements.append(sal_table)

    # Payment Status
    elements.append(Spacer(1, 20))
    status_text = f"Payment Status: {slip.paymentStatus}"
    if slip.paidAt:
        status_text += f" (Paid on {slip.paidAt.strftime('%Y-%m-%d')})"
    elements.append(Paragraph(status_text, styles['Normal']))

    # Footer
    elements.append(Spacer(1, 40))
    elements.append(Paragraph("This is a system-generated salary slip and does not require a signature.", footer_style))

    doc.build(elements)
    buffer.seek(0)

    emp_name = (emp.name or 'employee').replace(' ', '_')
    filename = f"SalarySlip_{emp_name}_{period.month}_{period.year}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "4000")))
