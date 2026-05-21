from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class UserBase(BaseModel):
    username: str
    email: str
    role: str


class UserCreate(UserBase):
    password: str
    linkedEmployeeId: Optional[int] = None


class UserResponse(UserBase):
    id: int
    linkedEmployeeId: Optional[int]
    createdAt: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: Optional[str] = None
    emailOrUsername: Optional[str] = None
    password: str


class TokenResponse(BaseModel):
    token: str
    user: UserResponse


class SettingsUpdate(BaseModel):
    name: Optional[str] = None
    jobTitle: Optional[str] = None
    timeZone: Optional[str] = None
    theme: Optional[str] = None
    emailUpdates: Optional[bool] = None
    taskReminders: Optional[bool] = None
    securityAlerts: Optional[bool] = None


class EmployeeBase(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    joiningDate: datetime
    baseSalary: Optional[float] = None
    allowance: Optional[float] = None


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeResponse(EmployeeBase):
    id: int
    employeeCode: str
    status: str

    class Config:
        from_attributes = True


class PayrollPeriodResponse(BaseModel):
    id: int
    month: int
    year: int
    status: str

    class Config:
        from_attributes = True


class SalarySlipResponse(BaseModel):
    id: int
    netSalary: float
    paymentStatus: str
    period: PayrollPeriodResponse

    class Config:
        from_attributes = True
