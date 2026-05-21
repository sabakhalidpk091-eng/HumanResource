from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Enum, Text, Table
from sqlalchemy.orm import relationship
from database import Base
import datetime
import enum

# Enums
class Role(str, enum.Enum):
    Admin = "Admin"
    HR = "HR"
    ProjectManager = "ProjectManager"
    Employee = "Employee"

class EmploymentType(str, enum.Enum):
    FULL_TIME = "FULL_TIME"
    PART_TIME = "PART_TIME"
    CONTRACT = "CONTRACT"

class EmployeeStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    ON_LEAVE = "ON_LEAVE"
    TERMINATED = "TERMINATED"

class WorkFormat(str, enum.Enum):
    OFFICE = "OFFICE"
    HYBRID = "HYBRID"
    REMOTE = "REMOTE"

class EmployeeDocumentType(str, enum.Enum):
    CV = "CV"
    ID_DOCUMENT = "ID_DOCUMENT"
    CONTRACT = "CONTRACT"
    OFFER_LETTER = "OFFER_LETTER"

# Models
class User(Base):
    __tablename__ = "Users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    passwordHash = Column(String(255))
    role = Column(String(50), default=Role.Employee)
    linkedEmployeeId = Column(Integer, ForeignKey("Employees.id"), unique=True, nullable=True)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    name = Column(String(100), nullable=True)
    jobTitle = Column(String(100), nullable=True)
    timeZone = Column(String(50), default="Asia/Karachi")
    theme = Column(String(20), default="system")
    emailUpdates = Column(Boolean, default=True)
    taskReminders = Column(Boolean, default=True)
    securityAlerts = Column(Boolean, default=True)

    employee = relationship("Employee", back_populates="user", uselist=False)

class Employee(Base):
    __tablename__ = "Employees"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(100), unique=True, index=True)
    phone = Column(String(20), nullable=True)
    cnic = Column(String(20), unique=True, nullable=True)
    department = Column(String(100), nullable=True)
    designation = Column(String(100), nullable=True)
    joiningDate = Column(DateTime)
    status = Column(String(50), default=EmployeeStatus.ACTIVE)
    baseSalary = Column(Float, nullable=True)
    allowance = Column(Float, nullable=True)
    offerLetterUrl = Column(String(255), nullable=True)
    workFormat = Column(String(50), default=WorkFormat.OFFICE)
    annualBalance = Column(Integer, default=14)
    sickBalance = Column(Integer, default=10)
    casualBalance = Column(Integer, default=5)
    employeeCode = Column(String(20), unique=True, index=True)
    employmentType = Column(String(50), default=EmploymentType.FULL_TIME)
    cvUrl = Column(String(255), nullable=True)
    idDocumentUrl = Column(String(255), nullable=True)
    contractUrl = Column(String(255), nullable=True)

    user = relationship("User", back_populates="employee", uselist=False)
    attendance = relationship("Attendance", back_populates="employee")
    leaveRequests = relationship("LeaveRequest", back_populates="employee")
    salarySlips = relationship("SalarySlip", back_populates="employee")
    trainings = relationship("EmployeeTraining", back_populates="employee")
    assets = relationship("Asset", back_populates="employee")
    managedProjects = relationship("Project", back_populates="projectManager")
    tasks = relationship("Task", back_populates="assignee")
    dailyReports = relationship("DailyReport", back_populates="employee")
    performance = relationship("PerformanceReview", back_populates="employee")

class Attendance(Base):
    __tablename__ = "Attendance"
    id = Column(Integer, primary_key=True, index=True)
    employeeId = Column(Integer, ForeignKey("Employees.id"))
    date = Column(DateTime)
    checkIn = Column(DateTime, nullable=True)
    checkOut = Column(DateTime, nullable=True)
    totalHours = Column(Float, nullable=True)
    remarks = Column(String(255), nullable=True)
    status = Column(String(50), nullable=True)
    isLate = Column(Boolean, default=False)
    isHalfDay = Column(Boolean, default=False)
    isOvertime = Column(Boolean, default=False)

    employee = relationship("Employee", back_populates="attendance")

class PayrollPeriod(Base):
    __tablename__ = "PayrollPeriods"
    id = Column(Integer, primary_key=True, index=True)
    month = Column(Integer)
    year = Column(Integer)
    startDate = Column(DateTime)
    endDate = Column(DateTime)
    status = Column(String(50)) # OPEN, PROCESSING, PAID, CLOSED
    processedAt = Column(DateTime, nullable=True)

    slips = relationship("SalarySlip", back_populates="period")

class SalarySlip(Base):
    __tablename__ = "SalarySlips"
    id = Column(Integer, primary_key=True, index=True)
    periodId = Column(Integer, ForeignKey("PayrollPeriods.id"))
    employeeId = Column(Integer, ForeignKey("Employees.id"))
    basicSalary = Column(Float)
    allowances = Column(Float)
    workingDays = Column(Integer)
    totalWorkDays = Column(Integer)
    absences = Column(Integer)
    halfDays = Column(Integer)
    grossSalary = Column(Float)
    totalDeductions = Column(Float)
    netSalary = Column(Float)
    paymentStatus = Column(String(50)) # PENDING, PAID
    paidAt = Column(DateTime, nullable=True)
    slipUrl = Column(String(255), nullable=True)

    employee = relationship("Employee", back_populates="salarySlips")
    period = relationship("PayrollPeriod", back_populates="slips")
    deductions = relationship("Deduction", back_populates="salarySlip")

class Deduction(Base):
    __tablename__ = "Deductions"
    id = Column(Integer, primary_key=True, index=True)
    salarySlipId = Column(Integer, ForeignKey("SalarySlips.id"))
    type = Column(String(50)) # ABSENCE, TAX, OTHER
    label = Column(String(100))
    amount = Column(Float)

    salarySlip = relationship("SalarySlip", back_populates="deductions")

class LeaveType(Base):
    __tablename__ = "LeaveTypes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50))
    isPaid = Column(Boolean, default=True)

    requests = relationship("LeaveRequest", back_populates="type")

class LeaveRequest(Base):
    __tablename__ = "LeaveRequests"
    id = Column(Integer, primary_key=True, index=True)
    employeeId = Column(Integer, ForeignKey("Employees.id"))
    typeId = Column(Integer, ForeignKey("LeaveTypes.id"))
    startDate = Column(DateTime)
    endDate = Column(DateTime)
    status = Column(String(50), default="pending")
    reason = Column(String(255), nullable=True)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)

    employee = relationship("Employee", back_populates="leaveRequests")
    type = relationship("LeaveType", back_populates="requests")

class PerformanceReview(Base):
    __tablename__ = "PerformanceReviews"
    id = Column(Integer, primary_key=True, index=True)
    employeeId = Column(Integer, ForeignKey("Employees.id"))
    periodStart = Column(DateTime)
    periodEnd = Column(DateTime)
    rating = Column(Integer)
    notes = Column(Text, nullable=True)

    employee = relationship("Employee", back_populates="performance")

class Project(Base):
    __tablename__ = "Projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    description = Column(Text, nullable=True)
    client = Column(String(100), nullable=True)
    startDate = Column(DateTime)
    endDate = Column(DateTime, nullable=True)
    status = Column(String(50), default="active")
    projectManagerId = Column(Integer, ForeignKey("Employees.id"))

    projectManager = relationship("Employee", back_populates="managedProjects")
    tasks = relationship("Task", back_populates="project")
    reports = relationship("DailyReport", back_populates="project")

class Task(Base):
    __tablename__ = "Tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100))
    description = Column(Text, nullable=True)
    projectId = Column(Integer, ForeignKey("Projects.id"))
    assigneeId = Column(Integer, ForeignKey("Employees.id"))
    priority = Column(String(20), default="medium")
    status = Column(String(20), default="todo")
    dueDate = Column(DateTime, nullable=True)
    estimatedHours = Column(Float, nullable=True)
    actualHours = Column(Float, nullable=True)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="tasks")
    assignee = relationship("Employee", back_populates="tasks")
    reports = relationship("DailyReportTask", back_populates="task")

class DailyReport(Base):
    __tablename__ = "DailyReports"
    id = Column(Integer, primary_key=True, index=True)
    employeeId = Column(Integer, ForeignKey("Employees.id"))
    projectId = Column(Integer, ForeignKey("Projects.id"))
    date = Column(DateTime)
    workSummary = Column(Text)
    hours = Column(Float)
    blockers = Column(Text, nullable=True)

    employee = relationship("Employee", back_populates="dailyReports")
    project = relationship("Project", back_populates="reports")
    tasks = relationship("DailyReportTask", back_populates="dailyReport")

class DailyReportTask(Base):
    __tablename__ = "DailyReportTasks"
    id = Column(Integer, primary_key=True, index=True)
    dailyReportId = Column(Integer, ForeignKey("DailyReports.id"))
    taskId = Column(Integer, ForeignKey("Tasks.id"))

    dailyReport = relationship("DailyReport", back_populates="tasks")
    task = relationship("Task", back_populates="reports")

class Attachment(Base):
    __tablename__ = "Attachments"
    id = Column(Integer, primary_key=True, index=True)
    relatedType = Column(String(50))
    relatedId = Column(Integer)
    fileName = Column(String(100))
    filePath = Column(String(255))
    uploadedBy = Column(Integer)
    uploadedAt = Column(DateTime, default=datetime.datetime.utcnow)
    taskId = Column(Integer, ForeignKey("Tasks.id"), nullable=True)
    dailyReportId = Column(Integer, ForeignKey("DailyReports.id"), nullable=True)

class EmployeeTraining(Base):
    __tablename__ = "EmployeeTrainings"
    id = Column(Integer, primary_key=True, index=True)
    employeeId = Column(Integer, ForeignKey("Employees.id"))
    title = Column(String(100))
    provider = Column(String(100), nullable=True)
    completedAt = Column(DateTime, nullable=True)
    expiryDate = Column(DateTime, nullable=True)
    status = Column(String(50), default="Enrolled")
    notes = Column(Text, nullable=True)

    employee = relationship("Employee", back_populates="trainings")

class Asset(Base):
    __tablename__ = "Assets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    type = Column(String(50))
    serialNumber = Column(String(100), unique=True, nullable=True)
    status = Column(String(50), default="Available")
    employeeId = Column(Integer, ForeignKey("Employees.id"), nullable=True)
    purchasedAt = Column(DateTime, nullable=True)
    warrantyEnd = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    employee = relationship("Employee", back_populates="assets")

class Vacancy(Base):
    __tablename__ = "Vacancies"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100))
    department = Column(String(100))
    location = Column(String(100))
    employmentType = Column(String(50), default="Full-time")
    status = Column(String(50), default="Open")
    postedDate = Column(DateTime, nullable=True)
    closingDate = Column(DateTime, nullable=True)
    description = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    applicants = relationship("Applicant", back_populates="vacancy")

class Applicant(Base):
    __tablename__ = "Applicants"
    id = Column(Integer, primary_key=True, index=True)
    vacancyId = Column(Integer, ForeignKey("Vacancies.id"))
    name = Column(String(100))
    email = Column(String(100))
    phone = Column(String(20), nullable=True)
    resumeUrl = Column(String(255), nullable=True)
    status = Column(String(50), default="Applied")
    appliedAt = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(Text, nullable=True)

    vacancy = relationship("Vacancy", back_populates="applicants")
