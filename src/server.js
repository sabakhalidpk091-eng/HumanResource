// src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dayjs from "dayjs";

import {
  PrismaClient,
  EmploymentType,
  EmployeeStatus,
  WorkFormat,
  EmployeeDocumentType,
} from "@prisma/client";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./authRoutes.js";
import { requireAuth, requireRoles } from "./authMiddleware.js";

dotenv.config();

const prisma = new PrismaClient();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve uploaded files from /uploads
const uploadsPath = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsPath));

// Global middleware
app.use(cors());
app.use(express.json());

// Auth routes (public)
app.use("/api/auth", authRoutes);

// Multer storage + validation (for employee documents)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "empdoc-" + unique + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only PDF, DOC, DOCX files are allowed"));
    }
    cb(null, true);
  },
});

// Helper: calculate total hours between two Date objects
function calculateTotalHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) return null;
  const diffMs = checkOut.getTime() - checkIn.getTime();
  if (diffMs <= 0) return null;
  const hours = diffMs / (1000 * 60 * 60);
  return Number(hours.toFixed(2));
}

// Helper: generate employeeCode like EMP-0001
async function generateEmployeeCode() {
  const lastEmp = await prisma.employee.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });
  const nextId = (lastEmp?.id || 0) + 1;
  const padded = String(nextId).padStart(4, "0");
  return `EMP-${padded}`;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// =====================
// OFFER LETTERS (EmployeeDocument + legacy field)
// =====================

app.post(
  "/api/employees/:id/offer-letter",
  requireAuth,
  requireRoles("Admin", "HR"),
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "File must be <= 1 MB" });
        }
        return res.status(400).json({ error: err.message || "Upload error" });
      }
      next();
    });
  },
  async (req, res) => {
    const id = Number(req.params.id);
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    try {
      await prisma.employeeDocument.create({
        data: {
          employeeId: id,
          type: EmployeeDocumentType.OFFER_LETTER,
          originalName: req.file.originalname,
          fileName: req.file.filename,
          filePath: fileUrl,
          mimeType: req.file.mimetype,
          uploadedBy: req.user?.id || null,
        },
      });

      const employee = await prisma.employee.update({
        where: { id },
        data: { offerLetterUrl: fileUrl },
      });
      res.json(employee);
    } catch (err) {
      console.error("Offer letter upload error:", err);
      res.status(400).json({ error: "Could not save offer letter" });
    }
  }
);

app.delete(
  "/api/employees/:id/offer-letter",
  requireAuth,
  requireRoles("Admin", "HR"),
  async (req, res) => {
    const id = Number(req.params.id);
    try {
      await prisma.employeeDocument.deleteMany({
        where: { employeeId: id, type: EmployeeDocumentType.OFFER_LETTER },
      });

      const employee = await prisma.employee.update({
        where: { id },
        data: { offerLetterUrl: null },
      });
      res.json(employee);
    } catch (err) {
      console.error("Offer letter delete error:", err);
      res.status(400).json({ error: "Could not remove offer letter" });
    }
  }
);
// CV
app.post(
  "/api/employees/:id/cv",
  requireAuth,
  requireRoles("Admin", "HR"),
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "File must be <= 1 MB" });
        }
        return res.status(400).json({ error: err.message || "Upload error" });
      }
      next();
    });
  },
  async (req, res) => {
    const id = Number(req.params.id);
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    try {
      await prisma.employeeDocument.create({
        data: {
          employeeId: id,
          type: EmployeeDocumentType.CV,
          originalName: req.file.originalname,
          fileName: req.file.filename,
          filePath: fileUrl,
          mimeType: req.file.mimetype,
          uploadedBy: req.user?.id || null,
        },
      });

      const employee = await prisma.employee.update({
        where: { id },
        data: { cvUrl: fileUrl }, // <— new legacy field
      });

      res.json(employee);
    } catch (err) {
      console.error("CV upload error:", err);
      res.status(400).json({ error: "Could not save CV" });
    }
  }
);
// ID document
app.post(
  "/api/employees/:id/id-document",
  requireAuth,
  requireRoles("Admin", "HR"),
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "File must be <= 1 MB" });
        }
        return res.status(400).json({ error: err.message || "Upload error" });
      }
      next();
    });
  },
  async (req, res) => {
    const id = Number(req.params.id);
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    try {
      await prisma.employeeDocument.create({
        data: {
          employeeId: id,
          type: EmployeeDocumentType.ID_DOCUMENT,
          originalName: req.file.originalname,
          fileName: req.file.filename,
          filePath: fileUrl,
          mimeType: req.file.mimetype,
          uploadedBy: req.user?.id || null,
        },
      });

      const employee = await prisma.employee.update({
        where: { id },
        data: { idDocumentUrl: fileUrl }, // <— new legacy field
      });

      res.json(employee);
    } catch (err) {
      console.error("ID document upload error:", err);
      res.status(400).json({ error: "Could not save ID document" });
    }
  }
);
// Contract
app.post(
  "/api/employees/:id/contract",
  requireAuth,
  requireRoles("Admin", "HR"),
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "File must be <= 1 MB" });
        }
        return res.status(400).json({ error: err.message || "Upload error" });
      }
      next();
    });
  },
  async (req, res) => {
    const id = Number(req.params.id);
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    try {
      await prisma.employeeDocument.create({
        data: {
          employeeId: id,
          type: EmployeeDocumentType.CONTRACT,
          originalName: req.file.originalname,
          fileName: req.file.filename,
          filePath: fileUrl,
          mimeType: req.file.mimetype,
          uploadedBy: req.user?.id || null,
        },
      });

      const employee = await prisma.employee.update({
        where: { id },
        data: { contractUrl: fileUrl }, // <— new legacy field
      });

      res.json(employee);
    } catch (err) {
      console.error("Contract upload error:", err);
      res.status(400).json({ error: "Could not save contract" });
    }
  }
);

// DELETE CV
app.delete(
  "/api/employees/:id/cv",
  requireAuth,
  requireRoles("Admin", "HR"),
  async (req, res) => {
    const id = Number(req.params.id);
    try {
      // remove from EmployeeDocument table
      await prisma.employeeDocument.deleteMany({
        where: {
          employeeId: id,
          type: EmployeeDocumentType.CV,
        },
      });

      // clear legacy field on Employee
      const employee = await prisma.employee.update({
        where: { id },
        data: { cvUrl: null },
      });

      res.json(employee);
    } catch (err) {
      console.error("CV delete error:", err);
      res.status(400).json({ error: "Could not remove CV" });
    }
  }
);

// DELETE ID document
app.delete(
  "/api/employees/:id/id-document",
  requireAuth,
  requireRoles("Admin", "HR"),
  async (req, res) => {
    const id = Number(req.params.id);
    try {
      await prisma.employeeDocument.deleteMany({
        where: {
          employeeId: id,
          type: EmployeeDocumentType.ID_DOCUMENT,
        },
      });

      const employee = await prisma.employee.update({
        where: { id },
        data: { idDocumentUrl: null },
      });

      res.json(employee);
    } catch (err) {
      console.error("ID document delete error:", err);
      res.status(400).json({ error: "Could not remove ID document" });
    }
  }
);

// DELETE Contract
app.delete(
  "/api/employees/:id/contract",
  requireAuth,
  requireRoles("Admin", "HR"),
  async (req, res) => {
    const id = Number(req.params.id);
    try {
      await prisma.employeeDocument.deleteMany({
        where: {
          employeeId: id,
          type: EmployeeDocumentType.CONTRACT,
        },
      });

      const employee = await prisma.employee.update({
        where: { id },
        data: { contractUrl: null },
      });

      res.json(employee);
    } catch (err) {
      console.error("Contract delete error:", err);
      res.status(400).json({ error: "Could not remove contract" });
    }
  }
);


// =====================
// EMPLOYEES
// =====================

app.get(
  "/api/employees",
  requireAuth,
  requireRoles("Admin", "HR", "ProjectManager", "Employee"),
  async (req, res) => {
    try {
      const { search = "", page = "1", pageSize = "10" } = req.query;

      const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
      const sizeNumber = Math.max(parseInt(pageSize, 10) || 10, 1);
      const skip = (pageNumber - 1) * sizeNumber;

      const where =
        search && search.trim().length > 0
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { department: { contains: search, mode: "insensitive" } },
                { designation: { contains: search, mode: "insensitive" } },
                { employeeCode: { contains: search, mode: "insensitive" } },
              ],
            }
          : {};

      const [totalCount, employees] = await Promise.all([
        prisma.employee.count({ where }),
        prisma.employee.findMany({
          where,
          orderBy: { id: "asc" },
          skip,
          take: sizeNumber,
        }),
      ]);

      res.json({
        data: employees,
        totalCount,
        page: pageNumber,
        pageSize: sizeNumber,
        totalPages: Math.ceil(totalCount / sizeNumber),
      });
    } catch (err) {
      console.error("Employees list error:", err);
      res.status(500).json({ error: "Could not fetch employees" });
    }
  }
);

app.post(
  "/api/employees",
  requireAuth,
  requireRoles("Admin", "HR"),
  async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        department,
        designation,
        joiningDate,
        status,
        baseSalary,
        allowance,
        workFormat,
        employmentType,
      } = req.body;

      if (!name || !email || !joiningDate) {
        return res
          .status(400)
          .json({ error: "Name, email and joining date are required." });
      }

      const code = await generateEmployeeCode();

      const employee = await prisma.employee.create({
        data: {
          employeeCode: code,
          name,
          email,
          phone,
          department,
          designation,
          joiningDate: new Date(joiningDate),
          status: status
            ? EmployeeStatus[status.toUpperCase()] || EmployeeStatus.ACTIVE
            : EmployeeStatus.ACTIVE,
          baseSalary:
            baseSalary !== null && baseSalary !== undefined
              ? Number(baseSalary)
              : null,
          allowance:
            allowance !== null && allowance !== undefined
              ? Number(allowance)
              : null,
          workFormat: workFormat
            ? WorkFormat[workFormat.toUpperCase()]
            : WorkFormat.OFFICE,
          employmentType: employmentType
            ? EmploymentType[employmentType.toUpperCase()]
            : EmploymentType.FULL_TIME,
        },
      });

      res.status(201).json(employee);
    } catch (err) {
      console.error("Employee create error:", err);
      if (err.code === "P2002" && err.meta?.target?.includes("email")) {
        return res.status(400).json({ error: "Email already exists" });
      }
      res.status(400).json({ error: "Could not create employee" });
    }
  }
);

app.put(
  "/api/employees/:id",
  requireAuth,
  requireRoles("Admin", "HR"),
  async (req, res) => {
    const id = Number(req.params.id);
    const {
      name,
      email,
      phone,
      department,
      designation,
      joiningDate,
      status,
      baseSalary,
      allowance,
      workFormat,
      employmentType,
    } = req.body;

    try {
      const employee = await prisma.employee.update({
        where: { id },
        data: {
          name,
          email,
          phone,
          department,
          designation,
          joiningDate: joiningDate ? new Date(joiningDate) : undefined,
          status: status ? EmployeeStatus[status.toUpperCase()] : undefined,
          baseSalary:
            baseSalary !== undefined && baseSalary !== null
              ? Number(baseSalary)
              : undefined,
          allowance:
            allowance !== undefined && allowance !== null
              ? Number(allowance)
              : undefined,
          workFormat: workFormat
            ? WorkFormat[workFormat.toUpperCase()]
            : undefined,
          employmentType: employmentType
            ? EmploymentType[employmentType.toUpperCase()]
            : undefined,
        },
      });
      res.json(employee);
    } catch (err) {
      console.error("Employee update error:", err);
      res.status(400).json({ error: "Could not update employee" });
    }
  }
);

app.delete(
  "/api/employees/:id",
  requireAuth,
  requireRoles("Admin", "HR"),
  async (req, res) => {
    const id = Number(req.params.id);
    try {
      await prisma.employee.delete({ where: { id } });
      res.json({ success: true });
    } catch (err) {
      console.error("Employee delete error:", err);
      res.status(400).json({ error: "Could not delete employee" });
    }
  }
);

// =====================
// PROJECTS
// =====================

app.get(
  "/api/projects",
  requireAuth,
  requireRoles("Admin", "HR", "ProjectManager", "Employee"),
  async (req, res) => {
    try {
      let where = {};

      if (req.user.role === "Employee") {
        if (!req.user.linkedEmployeeId) {
          return res.json([]);
        }

        const employeeId = req.user.linkedEmployeeId;

        where = {
          OR: [
            { projectManagerId: employeeId },
            {
              tasks: {
                some: {
                  assigneeId: employeeId,
                },
              },
            },
          ],
        };
      }

      const projects = await prisma.project.findMany({
        where,
        orderBy: { id: "asc" },
        include: {
          projectManager: true,
          _count: { select: { tasks: true } },
        },
      });
      res.json(projects);
    } catch (err) {
      console.error("Projects list error:", err);
      res.status(500).json({ error: "Could not fetch projects" });
    }
  }
);

app.post(
  "/api/projects",
  requireAuth,
  requireRoles("Admin", "HR", "ProjectManager"),
  async (req, res) => {
    try {
      const {
        name,
        description,
        client,
        startDate,
        endDate,
        status,
        projectManagerId,
      } = req.body;

      const project = await prisma.project.create({
        data: {
          name,
          description,
          client,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          status: status || "active",
          projectManagerId: Number(projectManagerId),
        },
      });

      res.status(201).json(project);
    } catch (err) {
      console.error("Project create error details:", err);
      res.status(400).json({ error: "Could not create project" });
    }
  }
);

app.put(
  "/api/projects/:id",
  requireAuth,
  requireRoles("Admin", "HR", "ProjectManager"),
  async (req, res) => {
    const id = Number(req.params.id);
    const {
      name,
      description,
      client,
      startDate,
      endDate,
      status,
      projectManagerId,
    } = req.body;

    try {
      const project = await prisma.project.update({
        where: { id },
        data: {
          name,
          description,
          client,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          status,
          projectManagerId: projectManagerId
            ? Number(projectManagerId)
            : undefined,
        },
      });
      res.json(project);
    } catch (err) {
      console.error("Project update error:", err);
      res.status(400).json({ error: "Could not update project" });
    }
  }
);

app.delete(
  "/api/projects/:id",
  requireAuth,
  requireRoles("Admin", "HR", "ProjectManager"),
  async (req, res) => {
    const id = Number(req.params.id);
    try {
      await prisma.project.delete({ where: { id } });
      res.json({ success: true });
    } catch (err) {
      console.error("Project delete error:", err);
      res.status(400).json({ error: "Could not delete project" });
    }
  }
);

// =====================
// TASKS
// =====================

app.get(
  "/api/tasks",
  requireAuth,
  requireRoles("Admin", "HR", "ProjectManager", "Employee"),
  async (req, res) => {
    const { projectId, assigneeId } = req.query;

    try {
      const where = {};

      if (projectId) {
        where.projectId = Number(projectId);
      }
      if (assigneeId) {
        where.assigneeId = Number(assigneeId);
      }

      if (req.user.role === "Employee") {
        if (!req.user.linkedEmployeeId) {
          return res.json([]);
        }
        where.assigneeId = req.user.linkedEmployeeId;
      }

      const tasks = await prisma.task.findMany({
        where,
        orderBy: { id: "asc" },
        include: {
          project: true,
          assignee: true,
        },
      });
      res.json(tasks);
    } catch (err) {
      console.error("Tasks list error:", err);
      res.status(500).json({ error: "Could not fetch tasks" });
    }
  }
);

app.post(
  "/api/tasks",
  requireAuth,
  requireRoles("Admin", "HR", "ProjectManager", "Employee"),
  async (req, res) => {
    try {
      const {
        title,
        description,
        projectId,
        assigneeId,
        priority,
        status,
        dueDate,
        estimatedHours,
        actualHours,
      } = req.body;

      const task = await prisma.task.create({
        data: {
          title,
          description,
          projectId: Number(projectId),
          assigneeId: Number(assigneeId),
          priority: priority || "medium",
          status: status || "todo",
          dueDate: dueDate ? new Date(dueDate) : null,
          estimatedHours: estimatedHours ? Number(estimatedHours) : null,
          actualHours: actualHours ? Number(actualHours) : null,
        },
      });
      res.status(201).json(task);
    } catch (err) {
      console.error("Task create error:", err);
      res.status(400).json({ error: "Could not create task" });
    }
  }
);

app.put(
  "/api/tasks/:id",
  requireAuth,
  requireRoles("Admin", "HR", "ProjectManager", "Employee"),
  async (req, res) => {
    const id = Number(req.params.id);
    const {
      title,
      description,
      projectId,
      assigneeId,
      priority,
      status,
      dueDate,
      estimatedHours,
      actualHours,
    } = req.body;

    try {
      const task = await prisma.task.update({
        where: { id },
        data: {
          title,
          description,
          projectId: projectId ? Number(projectId) : undefined,
          assigneeId: assigneeId ? Number(assigneeId) : undefined,
          priority,
          status,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          estimatedHours:
            estimatedHours !== undefined ? Number(estimatedHours) : undefined,
          actualHours:
            actualHours !== undefined ? Number(actualHours) : undefined,
        },
      });
      res.json(task);
    } catch (err) {
      console.error("Task update error:", err);
      res.status(400).json({ error: "Could not update task" });
    }
  }
);

app.delete(
  "/api/tasks/:id",
  requireAuth,
  requireRoles("Admin", "HR", "ProjectManager"),
  async (req, res) => {
    const id = Number(req.params.id);
    try {
      await prisma.task.delete({ where: { id } });
      res.json({ success: true });
    } catch (err) {
      console.error("Task delete error:", err);
      res.status(400).json({ error: "Could not delete task" });
    }
  }
);

// =====================
// STATS OVERVIEW
// =====================

app.get(
  "/api/stats/overview",
  requireAuth,
  requireRoles("Admin", "HR", "ProjectManager", "Employee"),
  async (req, res) => {
    try {
      const now = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(now.getDate() + 7);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);

      const [
        totalEmployees,
        activeEmployees,
        totalProjects,
        activeProjects,
        completedProjects,
        totalTasks,
        todoTasks,
        inProgressTasks,
        doneTasks,
        overdueTasks,
        dueNext7Days,
        newEmployeesLast30Days,
      ] = await Promise.all([
        prisma.employee.count(),
        prisma.employee.count({ where: { status: EmployeeStatus.ACTIVE } }),
        prisma.project.count(),
        prisma.project.count({ where: { status: "active" } }),
        prisma.project.count({ where: { status: "completed" } }),
        prisma.task.count(),
        prisma.task.count({ where: { status: "todo" } }),
        prisma.task.count({ where: { status: "in_progress" } }),
        prisma.task.count({ where: { status: "done" } }),
        prisma.task.count({
          where: {
            dueDate: { lt: now },
            status: { not: "done" },
          },
        }),
        prisma.task.count({
          where: {
            dueDate: {
              gte: now,
              lt: sevenDaysFromNow,
            },
            status: { not: "done" },
          },
        }),
        prisma.employee.count({
          where: {
            joiningDate: {
              gte: thirtyDaysAgo,
              lte: now,
            },
          },
        }),
      ]);

      res.json({
        employees: {
          total: totalEmployees,
          active: activeEmployees,
          inactive: totalEmployees - activeEmployees,
          newLast30Days: newEmployeesLast30Days,
        },
        projects: {
          total: totalProjects,
          active: activeProjects,
          completed: completedProjects,
          other: totalProjects - activeProjects - completedProjects,
        },
        tasks: {
          total: totalTasks,
          todo: todoTasks,
          in_progress: inProgressTasks,
          done: doneTasks,
          overdue: overdueTasks,
          due_next_7_days: dueNext7Days,
        },
      });
    } catch (err) {
      console.error("Stats overview error:", err);
      res.status(500).json({ error: "Could not fetch stats" });
    }
  }
);

// =====================
// STATS / ME (+ leaves & productivity)
// =====================

app.get(
  "/api/stats/me",
  requireAuth,
  requireRoles("Admin", "HR", "ProjectManager", "Employee"),
  async (req, res) => {
    try {
      console.log("stats/me req.user:", req.user);

      if (!req.user.linkedEmployeeId) {
        return res.status(200).json({
          hasEmployeeRecord: false,
          message: "User is not linked to an Employee record.",
        });
      }

      const employeeId = req.user.linkedEmployeeId;

      const now = new Date();
      const todayMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const thirtyDaysAhead = new Date(
        todayMidnight.getFullYear(),
        todayMidnight.getMonth(),
        todayMidnight.getDate() + 30
      );

      const emp = await prisma.employee.findUnique({
        where: { id: employeeId },
      });

      if (!emp) {
        return res.status(200).json({
          hasEmployeeRecord: false,
          message: "Linked employee record not found.",
        });
      }

      console.log("MyDashboard employee workFormat:", emp.workFormat);

      const joining = emp.joiningDate;
      const diffMs = now.getTime() - joining.getTime();
      const daysInCompany = Math.max(
        0,
        Math.floor(diffMs / (1000 * 60 * 60 * 24))
      );

      const tasksList = await prisma.task.findMany({
        where: { assigneeId: employeeId },
        orderBy: { dueDate: "asc" },
        include: { project: true },
      });

      const myTasksTotal = tasksList.length;
      const myTasksTodo = tasksList.filter((t) => t.status === "todo").length;
      const myTasksInProgress = tasksList.filter(
        (t) => t.status === "in_progress"
      ).length;
      const myTasksDone = tasksList.filter((t) => t.status === "done").length;
      const myOverdueTasks = tasksList.filter(
        (t) => t.dueDate && t.dueDate < now && t.status !== "done"
      ).length;

      const onboardingTasks = tasksList.filter((t) =>
        ["todo", "in_progress"].includes(t.status)
      );

      const onboardingDto = onboardingTasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        datetime: t.dueDate,
        projectName: t.project?.name || null,
      }));

      const [
        myProjectsAsManager,
        myProjectsAsContributor,
        myCompletedProjects,
        myActiveProjects,
      ] = await Promise.all([
        prisma.project.count({
          where: { projectManagerId: employeeId },
        }),
        prisma.project.count({
          where: {
            tasks: { some: { assigneeId: employeeId } },
          },
        }),
        prisma.project.count({
          where: {
            status: "completed",
            OR: [
              { projectManagerId: employeeId },
              { tasks: { some: { assigneeId: employeeId } } },
            ],
          },
        }),
        prisma.project.count({
          where: {
            status: "active",
            OR: [
              { projectManagerId: employeeId },
              { tasks: { some: { assigneeId: employeeId } } },
            ],
          },
        }),
      ]);

      const approvedLeaves = await prisma.leaveRequest.findMany({
        where: {
          employeeId,
          status: "approved",
          endDate: { gte: todayMidnight },
          startDate: { lte: thirtyDaysAhead },
        },
        include: { type: true },
        orderBy: { startDate: "asc" },
      });

      const approvedLeavesDto = approvedLeaves.map((lr) => ({
        id: lr.id,
        typeName: lr.type?.name || "Leave",
        startDate: lr.startDate,
        endDate: lr.endDate,
      }));

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const monthlyAttendance = await prisma.attendance.findMany({
        where: {
          employeeId,
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      let presentDays = 0;
      let absentDays = 0;
      let leaveDays = 0;

      for (const rec of monthlyAttendance) {
        const hasTimes = rec.checkIn && rec.checkOut;
        const remark = (rec.remarks || "").toLowerCase();
        if (hasTimes) {
          presentDays += 1;
        } else if (remark.includes("leave")) {
          leaveDays += 1;
        } else if (remark.includes("absent")) {
          absentDays += 1;
        }
      }

      const tasksThisMonth = tasksList.filter((t) => {
        if (!t.dueDate) return false;
        return t.dueDate >= monthStart && t.dueDate <= monthEnd;
      });
      const doneThisMonth = tasksThisMonth.filter(
        (t) => t.status === "done"
      ).length;
      const totalThisMonth = tasksThisMonth.length;

      const projectTaskMap = new Map();
      for (const t of tasksList) {
        if (!t.project) continue;
        const pid = t.project.id;
        if (!projectTaskMap.has(pid)) {
          projectTaskMap.set(pid, {
            projectId: pid,
            projectName: t.project.name,
            total: 0,
            done: 0,
          });
        }
        const entry = projectTaskMap.get(pid);
        entry.total += 1;
        if (t.status === "done") {
          entry.done += 1;
        }
      }
      const projectProductivity = Array.from(projectTaskMap.values());

      const sevenDays = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - i
        );
        const key = d.toISOString().slice(0, 10);
        sevenDays.push({ date: key, day: d });
      }

      const doneTasksByDueDate = tasksList.filter(
        (t) => t.status === "done" && t.dueDate
      );

      const doneCountByDay = new Map();
      for (const t of doneTasksByDueDate) {
        const d = new Date(t.dueDate);
        const key = d.toISOString().slice(0, 10);
        doneCountByDay.set(key, (doneCountByDay.get(key) || 0) + 1);
      }

      const dailyProductivity = sevenDays.map(({ date, day }) => ({
        date,
        label: day.toLocaleDateString(undefined, {
          weekday: "short",
          day: "numeric",
        }),
        done: doneCountByDay.get(date) || 0,
      }));

      return res.json({
        hasEmployeeRecord: true,
        employee: {
          id: emp.id,
          employeeCode: emp.employeeCode,
          name: emp.name,
          designation: emp.designation,
          joiningDate: emp.joiningDate,
          daysInCompany,
          workFormat: emp.workFormat || WorkFormat.OFFICE,
          annualBalance: emp.annualBalance ?? 0,
          sickBalance: emp.sickBalance ?? 0,
          casualBalance: emp.casualBalance ?? 0,
        },
        tasks: {
          total: myTasksTotal,
          todo: myTasksTodo,
          in_progress: myTasksInProgress,
          done: myTasksDone,
          overdue: myOverdueTasks,
          done_this_month: doneThisMonth,
          onboarding: onboardingDto,
        },
        projects: {
          asManager: myProjectsAsManager,
          asContributor: myProjectsAsContributor,
          completed: myCompletedProjects,
          inProgress: myActiveProjects,
        },
        leaves: {
          upcomingApproved: approvedLeavesDto,
        },
        attendance: {
          monthStart,
          monthEnd,
          presentDays,
          absentDays,
          leaveDays,
        },
        productivity: {
          tasksThisMonth: totalThisMonth,
          doneThisMonth,
          perProject: projectProductivity,
          dailyProductivity,
        },
      });
    } catch (err) {
      console.error("Personal stats error:", err);
      res.status(500).json({ error: "Could not fetch personal stats" });
    }
  }
);

// =====================
// ADMIN ALL TASKS VIEW
// =====================

app.get(
  "/api/admin/tasks",
  requireAuth,
  requireRoles("Admin", "HR", "ProjectManager"),
  async (req, res) => {
    try {
      const { status, assigneeId, projectId } = req.query;

      const where = {};

      if (status) where.status = status;
      if (assigneeId) where.assigneeId = Number(assigneeId);
      if (projectId) where.projectId = Number(projectId);

      const tasks = await prisma.task.findMany({
        where,
        orderBy: { id: "asc" },
        include: {
          assignee: true,
          project: true,
        },
      });

      res.json(tasks);
    } catch (err) {
      console.error("Admin tasks list error:", err);
      res.status(500).json({ error: "Could not fetch all tasks" });
    }
  }
);

// =====================
// USERS (Admin, HR)
// =====================

app.get(
  "/api/users",
  requireAuth,
  requireRoles("Admin", "HR"),
  async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        orderBy: { id: "asc" },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          linkedEmployeeId: true,
          createdAt: true,
        },
      });
      res.json(users);
    } catch (err) {
      console.error("Users list error:", err);
      res.status(500).json({ error: "Could not fetch users" });
    }
  }
);

app.put(
  "/api/users/:id/link-employee",
  requireAuth,
  requireRoles("Admin", "HR"),
  async (req, res) => {
    const id = Number(req.params.id);
    const { linkedEmployeeId } = req.body;

    try {
      const updated = await prisma.user.update({
        where: { id },
        data: {
          linkedEmployeeId:
            linkedEmployeeId === null || linkedEmployeeId === ""
              ? null
              : Number(linkedEmployeeId),
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          linkedEmployeeId: true,
          createdAt: true,
        },
      });
      res.json(updated);
    } catch (err) {
      console.error("User link-employee update error:", err);
      res.status(400).json({ error: "Could not update user link." });
    }
  }
);

// =====================
// USER SETTINGS
// =====================

app.get(
  "/api/me/settings",
  requireAuth,
  requireRoles("Admin", "HR", "ProjectManager", "Employee"),
  async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          name: true,
          jobTitle: true,
          timeZone: true,
          theme: true,
          emailUpdates: true,
          taskReminders: true,
          securityAlerts: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        name: user.name || "",
        jobTitle: user.jobTitle || "",
        timeZone: user.timeZone || "Asia/Karachi",
        theme: user.theme || "system",
        emailUpdates:
          user.emailUpdates !== null && user.emailUpdates !== undefined
            ? user.emailUpdates
            : true,
        taskReminders:
          user.taskReminders !== null && user.taskReminders !== undefined
            ? user.taskReminders
            : true,
        securityAlerts:
          user.securityAlerts !== null && user.securityAlerts !== undefined
            ? user.securityAlerts
            : true,
      });
    } catch (err) {
      console.error("Get settings error:", err);
      res.status(500).json({ error: "Could not load settings" });
    }
  }
);

app.put(
  "/api/me/settings",
  requireAuth,
  requireRoles("Admin", "HR", "ProjectManager", "Employee"),
  async (req, res) => {
    try {
      const {
        name,
        jobTitle,
        timeZone,
        theme,
        emailUpdates,
        taskReminders,
        securityAlerts,
      } = req.body;

      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          name,
          jobTitle,
          timeZone,
          theme,
          emailUpdates: Boolean(emailUpdates),
          taskReminders: Boolean(taskReminders),
          securityAlerts: Boolean(securityAlerts),
        },
        select: {
          id: true,
          name: true,
          jobTitle: true,
          timeZone: true,
          theme: true,
          emailUpdates: true,
          taskReminders: true,
          securityAlerts: true,
        },
      });

      res.json(updated);
    } catch (err) {
      console.error("Update settings error:", err);
      res.status(400).json({ error: "Could not save settings" });
    }
  }
);

// =====================
// ATTENDANCE
// =====================

// helper to derive flags & status
function buildAttendanceFlags(rawDate, checkInDate, checkOutDate, remarks) {
  // normalize to YYYY-MM-DD in case rawDate is ISO
  const dateStr =
    typeof rawDate === "string"
      ? rawDate.slice(0, 10)
      : dayjs(rawDate).format("YYYY-MM-DD");

  // company rules – adjust as needed
  const workStart = dayjs(`${dateStr}T09:00:00`); // 9 AM
  const minHalfDayHours = 4;
  const fullDayHours = 8;

  let status = "UNKNOWN";
  let isLate = false;
  let isHalfDay = false;
  let isOvertime = false;

  const hasCheckIn = !!checkInDate;
  const hasCheckOut = !!checkOutDate;

  const lowerRemarks = (remarks || "").toLowerCase();

  // no times => rely on remarks
  if (!hasCheckIn && !hasCheckOut) {
    if (lowerRemarks.includes("absent")) {
      status = "ABSENT";
    } else if (lowerRemarks.includes("leave")) {
      status = "LEAVE";
    } else {
      status = "UNKNOWN";
    }
    return { status, isLate, isHalfDay, isOvertime };
  }

  // both times present => compute flags from hours
  if (hasCheckIn && hasCheckOut) {
    const checkInD = dayjs(checkInDate);
    const checkOutD = dayjs(checkOutDate);
    const totalHours = checkOutD.diff(checkInD, "minute") / 60; // float hours

    if (checkInD.isAfter(workStart.add(10, "minute"))) {
      isLate = true;
    }

    if (totalHours < minHalfDayHours) {
      status = "HALF_DAY";
      isHalfDay = true;
    } else {
      status = "PRESENT";
    }

    if (totalHours > fullDayHours) {
      isOvertime = true;
    }
  }

  return { status, isLate, isHalfDay, isOvertime };
}

// Admin / HR / PM: list attendance with filters (date range, employee)
app.get(
  "/api/attendance",
  requireAuth,
  requireRoles("Admin", "HR", "ProjectManager"),
  async (req, res) => {
    try {
      const { from, to, employeeId } = req.query;

      const where = {};

      if (from || to) {
        const fromDate = from ? new Date(from) : new Date("1970-01-01");
        const toDate = to ? new Date(to) : new Date("2999-12-31");
        where.date = {
          gte: fromDate,
          lte: toDate,
        };
      }

      if (employeeId) {
        where.employeeId = Number(employeeId);
      }

      const records = await prisma.attendance.findMany({
        where,
        orderBy: { date: "desc" },
        include: {
          employee: {
            select: { id: true, name: true, department: true },
          },
        },
      });

      res.json(records);
    } catch (err) {
      console.error("List attendance error:", err);
      res.status(500).json({ error: "Could not fetch attendance." });
    }
  }
);

// Employee: my own attendance
app.get(
  "/api/attendance/me",
  requireAuth,
  requireRoles("Admin", "HR", "ProjectManager", "Employee"),
  async (req, res) => {
    try {
      if (!req.user.linkedEmployeeId) {
        return res.json([]);
      }

      const { from, to } = req.query;

      const where = {
        employeeId: req.user.linkedEmployeeId,
      };

      if (from || to) {
        const fromDate = from ? new Date(from) : new Date("1970-01-01");
        const toDate = to ? new Date(to) : new Date("2999-12-31");
        where.date = {
          gte: fromDate,
          lte: toDate,
        };
      }

      const records = await prisma.attendance.findMany({
        where,
        orderBy: { date: "desc" },
      });

      res.json(records);
    } catch (err) {
      console.error("My attendance error:", err);
      res.status(500).json({ error: "Could not fetch attendance." });
    }
  }
);

// Admin / HR: manual create or update attendance for a specific day
app.post(
  "/api/attendance",
  requireAuth,
  requireRoles("Admin", "HR"),
  async (req, res) => {
    try {
      const { employeeId, date, checkIn, checkOut, totalHours, remarks } =
        req.body;

      if (!employeeId || !date) {
        return res
          .status(400)
          .json({ error: "employeeId and date are required." });
      }

      const attendanceDate = new Date(date);
      const dayMidnight = new Date(
        attendanceDate.getFullYear(),
        attendanceDate.getMonth(),
        attendanceDate.getDate()
      );

      const checkInDate = checkIn ? new Date(checkIn) : null;
      const checkOutDate = checkOut ? new Date(checkOut) : null;

      const computedTotal =
        totalHours !== undefined && totalHours !== null
          ? Number(totalHours)
          : calculateTotalHours(checkInDate, checkOutDate); // your existing helper

      const { status, isLate, isHalfDay, isOvertime } = buildAttendanceFlags(
        date,
        checkInDate,
        checkOutDate,
        remarks
      );

      const data = {
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalHours: computedTotal,
        remarks: remarks || null,
        status,
        isLate,
        isHalfDay,
        isOvertime,
      };

      const record = await prisma.attendance.upsert({
        where: {
          employeeId_date: {
            employeeId: Number(employeeId),
            date: dayMidnight,
          },
        },
        update: data,
        create: {
          employeeId: Number(employeeId),
          date: dayMidnight,
          ...data,
        },
      });

      res.status(201).json(record);
    } catch (err) {
      console.error("Create/update attendance error:", err);
      res.status(400).json({ error: "Could not save attendance." });
    }
  }
);

// Employee: create/update own attendance for a date (self-check-in/out)
app.post(
  "/api/attendance/me",
  requireAuth,
  requireRoles("Admin", "HR", "ProjectManager", "Employee"),
  async (req, res) => {
    try {
      if (!req.user.linkedEmployeeId) {
        return res
          .status(400)
          .json({ error: "User is not linked to an employee." });
      }

      const { date, checkIn, checkOut, remarks } = req.body;

      if (!date) {
        return res.status(400).json({ error: "date is required." });
      }

      const attendanceDate = new Date(date);
      const dayMidnight = new Date(
        attendanceDate.getFullYear(),
        attendanceDate.getMonth(),
        attendanceDate.getDate()
      );

      const checkInDate = checkIn ? new Date(checkIn) : null;
      const checkOutDate = checkOut ? new Date(checkOut) : null;
      const totalHours = calculateTotalHours(checkInDate, checkOutDate); // your existing helper

      const { status, isLate, isHalfDay, isOvertime } = buildAttendanceFlags(
        date,
        checkInDate,
        checkOutDate,
        remarks
      );

      const data = {
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalHours,
        remarks: remarks || null,
        status,
        isLate,
        isHalfDay,
        isOvertime,
      };

      const record = await prisma.attendance.upsert({
        where: {
          employeeId_date: {
            employeeId: req.user.linkedEmployeeId,
            date: dayMidnight,
          },
        },
        update: data,
        create: {
          employeeId: req.user.linkedEmployeeId,
          date: dayMidnight,
          ...data,
        },
      });

      res.status(201).json(record);
    } catch (err) {
      console.error("Self attendance error:", err);
      res.status(400).json({ error: "Could not save attendance." });
    }
  }
);


// =====================
// VACANCIES
// =====================

app.get(
  "/api/vacancies",
  requireAuth,
  requireRoles("Admin", "HR", "ProjectManager", "Employee"),
  async (req, res) => {
    try {
      const vacancies = await prisma.vacancy.findMany({
        orderBy: { createdAt: "desc" },
      });
      res.json(vacancies);
    } catch (err) {
      console.error("Vacancies list error:", err);
      res.status(500).json({ error: "Could not load vacancies." });
    }
  }
);

app.post(
  "/api/vacancies",
  requireAuth,
  requireRoles("Admin", "HR"),
  async (req, res) => {
    try {
      const {
        title,
        department,
        location,
        employmentType,
        status,
        postedDate,
        closingDate,
        description,
      } = req.body;

      if (!title || !department || !location) {
        return res
          .status(400)
          .json({ error: "Title, department and location are required." });
      }

      const vacancy = await prisma.vacancy.create({
        data: {
          title,
          department,
          location,
          employmentType: employmentType || "Full-time",
          status: status || "Open",
          postedDate: postedDate ? new Date(postedDate) : null,
          closingDate: closingDate ? new Date(closingDate) : null,
          description: description || "",
        },
      });

      res.status(201).json(vacancy);
    } catch (err) {
      console.error("Create vacancy error:", err);
      res.status(500).json({ error: "Could not create vacancy." });
    }
  }
);

app.put(
  "/api/vacancies/:id",
  requireAuth,
  requireRoles("Admin", "HR"),
  async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid vacancy ID." });
    }

    try {
      const {
        title,
        department,
        location,
        employmentType,
        status,
        postedDate,
        closingDate,
        description,
      } = req.body;

      const vacancy = await prisma.vacancy.update({
        where: { id },
        data: {
          title,
          department,
          location,
          employmentType,
          status,
          postedDate: postedDate ? new Date(postedDate) : null,
          closingDate: closingDate ? new Date(closingDate) : null,
          description,
        },
      });

      res.json(vacancy);
    } catch (err) {
      console.error("Update vacancy error:", err);
      if (err.code === "P2025") {
        return res.status(404).json({ error: "Vacancy not found." });
      }
      res.status(500).json({ error: "Could not update vacancy." });
    }
  }
);

app.delete(
  "/api/vacancies/:id",
  requireAuth,
  requireRoles("Admin", "HR"),
  async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid vacancy ID." });
    }

    try {
      await prisma.vacancy.delete({ where: { id } });
      res.json({ success: true });
    } catch (err) {
      console.error("Delete vacancy error:", err);
      if (err.code === "P2025") {
        return res.status(404).json({ error: "Vacancy not found." });
      }
      res.status(500).json({ error: "Could not delete vacancy." });
    }
  }
);

// =====================
// LEAVE MANAGEMENT
// =====================

function isHrOrAdmin(user) {
  return user.role === "Admin" || user.role === "HR";
}

// Create a leave type (Admin / HR)
app.post(
  "/api/leave-types",
  requireAuth,
  requireRoles("Admin", "HR"),
  async (req, res) => {
    try {
      const { name, isPaid = true } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }
      const type = await prisma.leaveType.create({
        data: { name, isPaid: Boolean(isPaid) },
      });
      res.status(201).json(type);
    } catch (err) {
      console.error("Create leave type error:", err);
      res.status(400).json({ error: "Could not create leave type" });
    }
  }
);

// List leave types (all roles)
app.get(
  "/api/leave-types",
  requireAuth,
  requireRoles("Admin", "HR", "ProjectManager", "Employee"),
  async (req, res) => {
    try {
      const types = await prisma.leaveType.findMany({
        orderBy: { id: "asc" },
      });
      res.json(types);
    } catch (err) {
      console.error("List leave types error:", err);
      res.status(500).json({ error: "Could not fetch leave types" });
    }
  }
);

// Employee: create leave request
app.post(
  "/api/leaves",
  requireAuth,
  requireRoles("Admin", "HR", "ProjectManager", "Employee"),
  async (req, res) => {
    try {
      if (!req.user.linkedEmployeeId) {
        return res
          .status(400)
          .json({ error: "User is not linked to an employee." });
      }
      const { typeId, startDate, endDate, reason } = req.body;

      if (!typeId || !startDate || !endDate) {
        return res.status(400).json({
          error: "Type, start date and end date are required.",
        });
      }

      const reqObj = await prisma.leaveRequest.create({
        data: {
          employeeId: req.user.linkedEmployeeId,
          typeId: Number(typeId),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          reason: reason || "",
          status: "pending",
        },
        include: { type: true },
      });

      res.status(201).json(reqObj);
    } catch (err) {
      console.error("Create leave request error:", err);
      res.status(400).json({ error: "Could not create leave request" });
    }
  }
);

// Employee: my leave requests
app.get(
  "/api/leaves/me",
  requireAuth,
  requireRoles("Admin", "HR", "ProjectManager", "Employee"),
  async (req, res) => {
    try {
      if (!req.user.linkedEmployeeId) {
        return res.json([]);
      }

      const requests = await prisma.leaveRequest.findMany({
        where: { employeeId: req.user.linkedEmployeeId },
        orderBy: { createdAt: "desc" },
        include: { type: true },
      });

      res.json(requests);
    } catch (err) {
      console.error("My leaves error:", err);
      res.status(500).json({ error: "Could not fetch leave requests" });
    }
  }
);

// Admin / HR: all leave requests
app.get(
  "/api/leaves",
  requireAuth,
  requireRoles("Admin", "HR"),
  async (req, res) => {
    try {
      const { status } = req.query;
      const where = {};
      if (status) where.status = status;

      const requests = await prisma.leaveRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          type: true,
          employee: true,
        },
      });

      res.json(requests);
    } catch (err) {
      console.error("All leaves error:", err);
      res.status(500).json({ error: "Could not fetch leave requests" });
    }
  }
);

// Admin / HR / PM: leave summary for a date range
app.get(
  "/api/leaves/summary",
  requireAuth,
  requireRoles("Admin", "HR", "ProjectManager"),
  async (req, res) => {
    try {
      const { from, to, status, employeeId } = req.query;

      if (!from || !to) {
        return res.status(400).json({
          error: "Query params 'from' and 'to' are required (YYYY-MM-DD).",
        });
      }

      const fromDate = new Date(from);
      const toDate = new Date(to);
      if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
        return res.status(400).json({ error: "Invalid 'from' or 'to' date." });
      }

      const toEndOfDay = new Date(
        toDate.getFullYear(),
        toDate.getMonth(),
        toDate.getDate(),
        23,
        59,
        59,
        999
      );

      const where = {
        startDate: { lte: toEndOfDay },
        endDate: { gte: fromDate },
      };

      if (status) {
        where.status = status;
      }
      if (employeeId) {
        where.employeeId = Number(employeeId);
      }

      const leaves = await prisma.leaveRequest.findMany({
        where,
        orderBy: { startDate: "asc" },
        include: {
          type: true,
          employee: true,
        },
      });

      res.json(leaves);
    } catch (err) {
      console.error("Leave summary error:", err);
      res.status(500).json({ error: "Could not fetch leave summary." });
    }
  }
);

// Admin / HR: approve or reject (with balance deduction + attendance)
app.put(
  "/api/leaves/:id/status",
  requireAuth,
  requireRoles("Admin", "HR"),
  async (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ error: "Status must be 'approved' or 'rejected'" });
    }

    try {
      const existing = await prisma.leaveRequest.findUnique({
        where: { id },
        include: {
          type: true,
          employee: true,
        },
      });

      if (!existing) {
        return res.status(404).json({ error: "Leave request not found." });
      }

      const wasPending = existing.status === "pending";

      const updated = await prisma.leaveRequest.update({
        where: { id },
        data: { status },
        include: {
          type: true,
          employee: true,
        },
      });

      if (wasPending && status === "approved") {
        const start = new Date(existing.startDate);
        const end = new Date(existing.endDate);
        const msPerDay = 1000 * 60 * 60 * 24;

        const startMid = new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate()
        );
        const endMid = new Date(
          end.getFullYear(),
          end.getMonth(),
          end.getDate()
        );

        const days =
          Math.floor((endMid.getTime() - startMid.getTime()) / msPerDay) + 1;

        const typeName = (existing.type?.name || "").toLowerCase();

        let data = {};
        if (typeName.includes("annual")) {
          data = { annualBalance: { decrement: days } };
        } else if (typeName.includes("sick")) {
          data = { sickBalance: { decrement: days } };
        } else if (typeName.includes("casual")) {
          data = { casualBalance: { decrement: days } };
        }

        if (Object.keys(data).length > 0) {
          await prisma.employee.update({
            where: { id: existing.employeeId },
            data,
          });
        }

        const dates = [];
        for (
          let d = new Date(startMid);
          d.getTime() <= endMid.getTime();
          d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
        ) {
          dates.push(new Date(d));
        }

        const remarks = `Leave: ${existing.type?.name || "Leave"}`;

        for (const day of dates) {
          const dayMidnight = new Date(
            day.getFullYear(),
            day.getMonth(),
            day.getDate()
          );

          await prisma.attendance.upsert({
            where: {
              employeeId_date: {
                employeeId: existing.employeeId,
                date: dayMidnight,
              },
            },
            update: {
              remarks,
            },
            create: {
              employeeId: existing.employeeId,
              date: dayMidnight,
              remarks,
            },
          });
        }
      }

      res.json(updated);
    } catch (err) {
      console.error("Update leave status error:", err);
      res.status(400).json({ error: "Could not update leave status" });
    }
  }
);

// Employee & HR/Admin edit leave
app.put(
  "/api/leaves/:id",
  requireAuth,
  requireRoles("Admin", "HR", "ProjectManager", "Employee"),
  async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid leave ID." });
    }

    const { typeId, startDate, endDate, reason } = req.body;

    try {
      const leave = await prisma.leaveRequest.findUnique({
        where: { id },
      });

      if (!leave) {
        return res.status(404).json({ error: "Leave request not found." });
      }

      const isOwner = leave.employeeId === req.user.linkedEmployeeId;

      if (!isOwner && !isHrOrAdmin(req.user)) {
        return res
          .status(403)
          .json({ error: "Not allowed to edit this leave." });
      }
      if (!isHrOrAdmin(req.user) && leave.status !== "pending") {
        return res
          .status(400)
          .json({ error: "Only pending leaves can be edited." });
      }

      const updated = await prisma.leaveRequest.update({
        where: { id },
        data: {
          typeId: typeId ? Number(typeId) : leave.typeId,
          startDate: startDate ? new Date(startDate) : leave.startDate,
          endDate: endDate ? new Date(endDate) : leave.endDate,
          reason: reason != null ? reason : leave.reason,
        },
        include: { type: true, employee: true },
      });

      res.json(updated);
    } catch (err) {
      console.error("Update leave error:", err);
      res.status(500).json({ error: "Failed to update leave request." });
    }
  }
);

// Employee cancel (pending) and HR/Admin delete
app.delete(
  "/api/leaves/:id",
  requireAuth,
  requireRoles("Admin", "HR", "ProjectManager", "Employee"),
  async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid leave ID." });
    }

    try {
      const leave = await prisma.leaveRequest.findUnique({
        where: { id },
      });

      if (!leave) {
        return res.status(404).json({ error: "Leave request not found." });
      }

      const isOwner = leave.employeeId === req.user.linkedEmployeeId;

      if (!isOwner && !isHrOrAdmin(req.user)) {
        return res
          .status(403)
          .json({ error: "Not allowed to delete this leave." });
      }

      if (!isHrOrAdmin(req.user) && leave.status !== "pending") {
        return res
          .status(400)
          .json({ error: "Only pending leaves can be cancelled." });
      }

      await prisma.leaveRequest.delete({ where: { id } });

      res.json({ success: true });
    } catch (err) {
      console.error("Delete leave error:", err);
      res.status(500).json({ error: "Failed to delete leave request." });
    }
  }
);

app.get(
  "/api/employees/:id/documents",
  requireAuth,
  requireRoles("Admin", "HR", "ProjectManager", "Employee"),
  async (req, res) => {
    const id = Number(req.params.id);
    try {
      const docs = await prisma.employeeDocument.findMany({
        where: { employeeId: id },
        orderBy: { uploadedAt: "desc" },
      });
      res.json(docs);
    } catch (err) {
      console.error("Employee documents list error:", err);
      res.status(500).json({ error: "Could not fetch employee documents" });
    }
  }
);

// =====================
// EMPLOYEE DOCUMENTS (CV / ID / CONTRACT)
// =====================

// CV
app.post(
  "/api/employees/:id/cv",
  requireAuth,
  requireRoles("Admin", "HR"),
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "File must be <= 1 MB" });
        }
        return res.status(400).json({ error: err.message || "Upload error" });
      }
      next();
    });
  },
  async (req, res) => {
    const id = Number(req.params.id);
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    try {
      const doc = await prisma.employeeDocument.create({
        data: {
          employeeId: id,
          type: EmployeeDocumentType.CV,
          originalName: req.file.originalname,
          fileName: req.file.filename,
          filePath: fileUrl,
          mimeType: req.file.mimetype,
          uploadedBy: req.user?.id || null,
        },
      });
      res.json(doc);
    } catch (err) {
      console.error("CV upload error:", err);
      res.status(400).json({ error: "Could not save CV" });
    }
  }
);

// ID document
app.post(
  "/api/employees/:id/id-document",
  requireAuth,
  requireRoles("Admin", "HR"),
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "File must be <= 1 MB" });
        }
        return res.status(400).json({ error: err.message || "Upload error" });
      }
      next();
    });
  },
  async (req, res) => {
    const id = Number(req.params.id);
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    try {
      const doc = await prisma.employeeDocument.create({
        data: {
          employeeId: id,
          type: EmployeeDocumentType.ID_DOCUMENT,
          originalName: req.file.originalname,
          fileName: req.file.filename,
          filePath: fileUrl,
          mimeType: req.file.mimetype,
          uploadedBy: req.user?.id || null,
        },
      });
      res.json(doc);
    } catch (err) {
      console.error("ID document upload error:", err);
      res.status(400).json({ error: "Could not save ID document" });
    }
  }
);

// Contract
app.post(
  "/api/employees/:id/contract",
  requireAuth,
  requireRoles("Admin", "HR"),
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "File must be <= 1 MB" });
        }
        return res.status(400).json({ error: err.message || "Upload error" });
      }
      next();
    });
  },
  async (req, res) => {
    const id = Number(req.params.id);
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    try {
      const doc = await prisma.employeeDocument.create({
        data: {
          employeeId: id,
          type: EmployeeDocumentType.CONTRACT,
          originalName: req.file.originalname,
          fileName: req.file.filename,
          filePath: fileUrl,
          mimeType: req.file.mimetype,
          uploadedBy: req.user?.id || null,
        },
      });
      res.json(doc);
    } catch (err) {
      console.error("Contract upload error:", err);
      res.status(400).json({ error: "Could not save contract" });
    }
  }
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
