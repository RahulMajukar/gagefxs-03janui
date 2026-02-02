# Qsutra - Gage Management System

## Overview

Qsutra - Gage Management System is a web-based calibration and gage lifecycle management application developed for **STRATUM aerospace**. The system digitizes the end-to-end workflow of industrial measurement gages — from master data creation and calibration scheduling to allocation, usage tracking, incident reporting, and retirement — replacing manual logs and spreadsheets with a secure, auditable, and role-based digital platform.

<table>
  <tr>
    <td align="center" width="50%">
      <img width="300" height="300" alt="Qsutra GageFX Platform Logo" src="https://github.com/user-attachments/assets/cbe6742c-df99-43e4-8d7e-9a0e0bce1b95" /><br/>
      <em>Platform: Qsutra GageFX</em>
    </td>
    <td width="10%"></td>
    <td align="center" width="100%">
      <img width="600" height="300" alt="STRATUM aerospace Client Logo" src="https://github.com/user-attachments/assets/6e1563bc-7026-458c-8f1d-c1f416bfef6f" /><br/>
      <em>Client: STRATUM aerospace</em>
    </td>
  </tr>
</table>


**Version**: 2.0.1 (7th April, 2025)  
**Client**: STRATUM aerospace 

---

##  Table of Contents

- [Purpose](#purpose)
- [Key Features](#key-features)
- [User Roles](#user-roles)
- [Application Screenshots](#application-screenshots)
  - [Login Page](#login-page)
  - [Admin Dashboard](#admin-dashboard)
  - [Add & Edit Gage](#add-gage)
  - [Card & Table Views](#admin-module--card-view)
  - [Operator Dashboard & Workflows](#operator-dashboard)
  - [Plant HOD Dashboard & Workflows](#plant-hod-dashboard)
  - [Store Manager & IT Admin](#store-manager--inventory-dashboard)
- [System Architecture](#system-architecture)
- [Core Workflows](#core-workflows)
- [Directory Structure](#directory-structure)
- [API Services](#api-services)

---

## Purpose

This system enables six distinct user roles to collaborate on gage management while enforcing compliance and traceability. It allows stakeholders to:

- Create and manage gage master data (Admin)
- Issue and track gage inventory (Store Manager)
- Use gages within calibrated limits (Operator)
- Report damage or incidents with attachments (Operator)
- Approve reallocation requests (Plant HOD)
- Manage calibration schedules and certificates (Calibration Manager)
- Configure users and org structure (IT Admin)
- Maintain full audit history of every gage

---

## Key Features

- **Role-Based Access Control (RBAC)**: Six isolated modules for IT Admin, Admin, Store Manager, Operator, Plant HOD, and Calibration Manager
- **Dual Views**: Card & Table layouts for gage browsing
- **Detail Modals**: Tabs for Notes, Manual (PDF), Images
- **Auto Alerts**: Blocks gage use if usage count or calibration date is expired
- **Incident Reporting**: Upload images, videos, PDFs with gage metadata
- **Reallocation Workflow**: Operator → Plant HOD → approval with email + in-app notification
- **Status Tracking**: Active, Issued, Out of Calibration, Retired
- **Digital Audit Trail**: Every action logged with user, timestamp, and context

---

## User Roles

### IT Admin
- Create and manage users (assign roles)
- Define organizational hierarchy: Department → Function → Operation
- Create chat groups for cross-role communication

### Admin
- Create/edit gages, manufacturers, service providers, types, categories
- View in Card/Table mode
- Manage manuals, notes, and images

### Store Manager
- Monitor gage inventory by status
- Issue gages to Department → Function → Operation → User
- View current holder and calibration due date

### Operator
- View only assigned gages
- Use gages within allowed usage and calibration window
- Report damage with multi-attachment support
- Request reallocation when expired

### Plant HOD
- Receive and approve/reject reallocation requests
- Review incident reports
- View team-level gage utilization

### Calibration Manager
- View upcoming/overdue calibrations
- Upload calibration certificates (PDF)
- Update status and set next due date

---

## Application Screenshots

### Login Page
<img width="1341" height="701" alt="image" src="https://github.com/user-attachments/assets/c5bd7b2d-4b1e-421f-9949-d718aef6bc40" />


*Role-based login with Qsutra & STRATUM branding. Users select role, enter credentials, and sign in.*

### IT Admin – Administration Dashboard
<img width="3202" height="1842" alt="image" src="https://github.com/user-attachments/assets/fa66e3b0-11fa-409e-ac3d-5dcf55619d35" />
*Central hub to manage users, departments, functions, operations, roles, and chat forums.*

1. **System Entity Overview**  
  - View real-time counts: **19 Users**, **4 Departments**, **3 Functions**, **3 Operations**, **10 Roles**, **0 Chat Forums**  
  - Quick-access tiles for each entity type

2. **User & Role Management**  
  - View **Current Users** with email, name, username, phone, department, and role  
  - Use **Add New User** button to create accounts with assigned roles

3. **Organizational Structure Control**  
  - Navigate tabs for **Departments**, **Functions**, **Operations**, **Roles**, and **Chat Forum**  
  - Define and maintain hierarchy: Department → Function → Operation → User

> 🔐 Only IT Admin can configure system entities — all changes are audited with user, timestamp, and before/after state.
---
### IT Admin – Create User Form
<img width="2256" height="1792" alt="image" src="https://github.com/user-attachments/assets/fb62936f-440e-46bb-a89c-41d2d36e43a7" />


*Modal form to create a new user with personal info, role, department, function, operation, and location details.*

1. **Personal Information**  
  - Enter **First Name**, **Last Name**, **Username**, and **Phone** (required)  
  - Optional: Add **Email** and upload **Profile Picture**

2. **Organization & Role Assignment**  
  - Select **Department(s)** via checkboxes (e.g., Engineering, Tooling)  
  - Choose **Role** from dropdown (e.g., IT_ADMIN, ROLE_OPERATOR)  
  - Assign **Functions** and **Operations** using multi-select lists

3. **Location & Permissions**  
  - Set **Location**, **Area**, and **Plant** for operational context  
  - Click **Create User** to finalize — system auto-generates credentials if admin doesn’t set password

> 🔐 All user creation actions are logged with timestamp, creator, and assigned permissions for audit compliance.
---
### IT Admin – Add Department
<img width="2346" height="1838" alt="image" src="https://github.com/user-attachments/assets/d8e5aea4-4e68-435e-9603-3c0037892db8" />


*Modal to define a new department with name, type, contact, budget, shifts, and operations.*

1. **General & Contact Info**  
  - Enter **Department Name** and select **Type** from dropdown  
  - Add **Contact Person**, **Email**, and **Phone** for administrative reference

2. **Financial & Operational Setup**  
  - Define **Cost Center** and **Budget** for tracking  
  - Use **+ Add Shift** and **+ Add Task** to link operational workflows

3. **Save & Activate**  
  - Click **Save** to create department  
  - New departments appear in user assignment dropdowns immediately

> 🏢 Departments form the top layer of organizational hierarchy — critical for role-based gage allocation.
---

### IT Admin – Add Function
<img width="1410" height="726" alt="image" src="https://github.com/user-attachments/assets/322180af-ddb4-4cf2-bd48-b9c38f82d564" />


*Modal to create a new function with name, code, and description for operational grouping.*

1. **Function Identification**  
  - Enter **Function Name** (required) and optional **Code** for system reference  
  - Add **Description** to clarify purpose or scope

2. **Hierarchical Linking**  
  - Functions are assigned to departments during user creation  
  - Used to filter gage access and workflow permissions

3. **Save & Apply**  
  - Click **Save** to finalize — function appears in dropdowns across the system

> ⚙️ Functions enable granular control over which users can access specific gages or tasks.
---
### IT Admin – Add Operation
<img width="2682" height="1530" alt="image" src="https://github.com/user-attachments/assets/433de451-69ab-41af-b685-0fb0d9a2c214" />
*Modal to define an operation with name, code, estimated time, and required skills.*

1. **Operation Details**  
  - Enter **Operation Name** and optional **Code**  
  - Add **Description** for clarity on task scope

2. **Constraints & Requirements**  
  - Set **Estimated Time (min)** for planning and scheduling  
  - Define **Required Skills** to ensure qualified operators are assigned

3. **Save & Link**  
  - Click **Save** to create — operations are linked to functions and users  
  - Used to validate gage usage against operator qualifications

> 🛠️ Operations tie gage usage to real-world tasks — ensuring compliance and efficiency.
---

### IT Admin – Add Role
<img width="2890" height="1900" alt="image" src="https://github.com/user-attachments/assets/53a24290-c9c0-400b-9abd-9eef4c7b25ad" />
*Modal to create a new role with name, description, permissions, and scope (functions/operations).*

1. **Role Definition**  
  - Enter **Role Name** and optional **Description**  
  - Assign **Permissions**: View, Create, Edit, Delete

2. **Scope Configuration**  
  - Select **Functions** and **Operations** this role can access  
  - Defines what data and actions are visible per user

3. **Save & Deploy**  
  - Click **Save** to activate role  
  - Appears in user creation dropdowns for instant assignment

> 🔐 Roles enforce RBAC — ensuring only authorized users can perform critical actions.
---
### IT Admin – Manage Chat Groups/Create New Group
<img width="3224" height="1810" alt="image" src="https://github.com/user-attachments/assets/e2b27c56-78b5-4fc2-86ea-0a6b9b6f5cc9" />
*Modal to create a new group chat by selecting members via department, role, function, or operation.*

1. **Group Setup**  
  - Enter **Group Name** and optional **Description**  
  - Use search bar to find users by name, username, or email

2. **Member Selection**  
  - Filter users by **Department**, **Role**, **Function**, or **Operation**  
  - Select individual users or use “Select all 19 filtered users” checkbox

3. **Create & Activate**  
  - Click **Create Group** to finalize  
  - Group appears in Chat Forum for instant messaging and collaboration

> 💬 Enables cross-role communication — essential for incident response, calibration alerts, and operational coordination.
---
### Admin Dashboard
<img width="1352" height="649" alt="image" src="https://github.com/user-attachments/assets/32655864-a15a-4e1c-80fb-4cf76bfe78d1  " />

### Admin Dashboard Continue Part
<img width="1352" height="650" alt="image" src="https://github.com/user-attachments/assets/68049ae8-3c98-47e5-84ed-6803d6c0af81  " />

*Role-specific dashboard for master data management with four core capabilities:*

1. **Gage & Master Data Overview**  
   - Displays **Total Gages**, **Calibrated This Month**, **Due for Calibration**, and **Active Partners**  
   - Real-time metrics for quality and compliance monitoring

2. **Quick-Access Management**  
   - One-click creation of **Gages**, **Types**, **Categories**, **Manufacturers**, and **Service Providers**  
   - Centralized entry point for all master data entities

3. **Dual Browsing Views**  
   - Toggle between **Card View** (visual, image-rich) and **Table View** (dense, sortable)  
   - Supports filtering and search across gage inventory

4. **Full Gage Lifecycle Control**  
   - Create, edit, and retire gages  
   - Attach **PDF manuals**, **notes**, and **reference images** to each gage record

> 📁 All actions are logged in the audit trail with user, timestamp, and change details.
---

### Add Gage 

<table>
  <tr>
    <td><img width="1351" height="648" alt="Admin Dashboard - Part 1" src="https://github.com/user-attachments/assets/9f41b289-10ea-4aa1-9aa2-f41604e05df3" /></td>
  </tr>
  <tr>
    <td><img width="1348" height="646" alt="Admin Dashboard - Part 2" src="https://github.com/user-attachments/assets/8e07730b-fba2-4909-b079-c89252b3afec" /></td>
  </tr>
  <tr>
    <td style="text-align: center; font-size: 0.9em; padding-top: 10px;">
      <em>Add Gage showing key metrics and quick actions. Full view requires vertical scroll.</em>
    </td>
  </tr>
</table>
      
---

### Admin Module –Scan Barcode/QR Code
<img width="1351" height="649" alt="image" src="https://github.com/user-attachments/assets/622f9a47-564b-4092-bf0b-151835711f6b" />

---

### Admin Module – Card View
<img width="1350" height="647" alt="image" src="https://github.com/user-attachments/assets/c58fd19b-f435-489c-ac4b-84ff4e60cfdd" />

---
### Admin Module – Table View
<img width="1348" height="645" alt="image" src="https://github.com/user-attachments/assets/de04e46d-3fab-4915-954d-d8ebc897629c" />

---

### Edit Gage 

<table>
  <tr>
    <td><img width="1351" height="649" alt="image" src="https://github.com/user-attachments/assets/9e75f227-278e-47b6-be87-a736eed286d2" /></td>
  </tr>
  <tr>
    <td><img width="1351" height="648" alt="image" src="https://github.com/user-attachments/assets/ef679eab-57f3-4991-8a16-bc5aa7dcf7b7" /></td>
  </tr>
  <tr>
    <td style="text-align: center; font-size: 0.9em; padding-top: 10px;">
      <em>Edit existing gage details showing key metrics and quick actions. Full view requires vertical scroll.</em>
    </td>
  </tr>
</table>

---
### Store Manager – Inventory Dashboard
<img width="3198" height="1988" alt="image" src="https://github.com/user-attachments/assets/9ee49162-e819-4599-8016-22197a64b964" />

*Monitor gage inventory by status and issue gages to Department → Function → Operation → User.*

1. **Inventory Status Monitoring**  
  - View real-time counts of **Available Gages (1)** and **Issued Gages (0)**  
  - Track **Gage Usage by Type** (e.g., Dial Indicators) with active status highlighted

2. **Gage Issuance Workflow**  
  - Use the **Issue Gage** button to assign a gage to a user via the full hierarchy: **Department → Function → Operation → User**  
  - System auto-logs **current holder**, **issue timestamp**, and **calibration due date**

3. **Operational Case Tracking**  
  - Review **Open Cases (5 total, 1 past due)** like “Machine Breakdown” or “Worker Safety Concern”  
  - Link gage issuance or return actions directly to operational incidents

> 📦 The Store Manager ensures physical gages are tracked, assigned, and aligned with operational needs — maintaining audit-ready records at all times.
---
## Store Manager – Issue Gage Form
<img width="3214" height="1816" alt="image" src="https://github.com/user-attachments/assets/282f6b79-47e1-4664-a19b-b906304590c0" />
*Modal form to issue a gage by selecting type, serial, department, function, operation, and assignee.*

1. **Gage Selection**  
  - Select **Gage Type** and **Serial Number** from dropdowns to identify the specific gage  
  - System auto-fills **Location** based on gage master data

2. **Assignment Hierarchy**  
  - Choose **Department**, **Function**, and **Operation** using cascading dropdowns  
  - Assign gage to a specific team member via the **Assigned To** field

3. **Issue Details & Attachments**  
  - Add a detailed **Description** of the issuance context or purpose  
  - Upload supporting files (images, PDFs) via the **Attachments** section  
  - Submit with the **Submit Issue** button to finalize assignment

> 📤 All issued gages are logged in the audit trail with user, timestamp, and full assignment path.

 ### Store Manager – All Issued Gages
 
<img width="3216" height="1641" alt="image" src="https://github.com/user-attachments/assets/4514c91d-261f-4931-817b-9c8ed5ef110c" />

*Panel to view and search all currently issued gages with real-time status and holder details.*

1. **Live Inventory View**  
  - See **Serial Number**, **Gage Type**, **Assigned To**, and **Issue Date**  
  - Status reflects current usage and calibration window

2. **Search & Filter**  
  - Type in search bar to filter by **name**, **serial**, or **user**  
  - Instant results with no page reload

3. **Operational Visibility**  
  - Identify over-allocated users or idle gages  
  - Supports return, reissue, or incident linking from this view

> 🔍 Provides full transparency of gage whereabouts — critical for compliance and efficiency
---
### Operator Dashboard
<img width="1357" height="649" alt="image" src="https://github.com/user-attachments/assets/5622544c-cb8f-405e-902f-5149303665f1  " />

*Personalized dashboard for shop-floor gage usage with three key workflows:*

1. **Assigned Gage Visibility**  
   - View **only gages issued** to the current user (role-based isolation)  
   - See real-time status: **Active**, **Issued**, **Out of Calibration**

2. **Controlled Gage Usage**  
   - Log usage within **allowed count** and **calibration window**  
   - System **blocks further use** if limits are exceeded — ensuring compliance

3. **Incident & Reallocation Initiation**  
   - Report **damage or anomalies** with multi-file attachments (images, videos, PDFs)  
   - Request **reallocation** when gage expires — triggering Plant HOD approval workflow

> ⚠️ On expiry, a **non-dismissible alert** appears with options to **View Data** or **Request Reallocation**.
---

### Operator Gage Usage Form
<img width="1360" height="866" alt="image" src="https://github.com/user-attachments/assets/df35f581-d2fd-4ddb-b30d-80a3168c6ff7" />

---

### Operator – Expiry Alert & Incident Report
<img width="1354" height="643" alt="image" src="https://github.com/user-attachments/assets/5c999d6d-eaa7-4092-99d9-6301869e3feb" />

*Non-dismissible popup when gage expires. Options: View Data or Request Reallocation.*

---

### Operator – Request Reallocation Form
<img width="1358" height="1045" alt="image" src="https://github.com/user-attachments/assets/1b17cfc2-e4ea-41b4-8ab1-c20975eb7cb1" />

---

### Operator – Generate Support Ticket(Report Issue)
<img width="1356" height="646" alt="image" src="https://github.com/user-attachments/assets/d4241228-a2b0-4f4e-ba7c-53db12693fd2" />
  
*Multi-file upload (images, videos, PDFs) with auto-attached gage metadata.*

---

### Plant HOD Dashboard

<img width="1354" height="650" alt="image" src="https://github.com/user-attachments/assets/a370beb8-dd3b-4166-90e7-8348c94abce4" />


*Centralized dashboard for Plant Head of Department (HOD) with three core capabilities:*

### Plant HOD - Reallocation Management
<img width="1347" height="649" alt="image" src="https://github.com/user-attachments/assets/7ad02150-b8df-4134-9399-305b1643d891" />


1. **Reallocation Requests**  
   - Receives **notifications and emails** when Operators request extended gage usage  
   - Views full gage details, reason for request, and usage status  
   - **Approve or Reject** directly from dashboard — decision triggers email to Operator

### Plant HOD - Approve Reallocation Request
<img width="1354" height="649" alt="image" src="https://github.com/user-attachments/assets/8226baee-1ce7-4774-b404-8476d758296c" />

---

2. **Gage Inventory Visibility**  
   - View **Available**, **Issued**, and **Out of Calibration** gages  
   - Reallocate gages to Operators without Store Manager intervention (if permitted)

3. **Org Structure Management**  
   - Edit **Department → Function → Operation Line** assignments  
   - Reassign gages to new operational contexts as needed

> 📬 All actions generate audit logs and user notifications for traceability.

---
### Calibration Dashboard Status

> Summary of gage calibration metrics as of November 10, 2025
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/50f1a9d4-1040-4799-8b4a-3b896488e500" />

## Overview

| Metric                | Value | Notes                          |
|-----------------------|-------|--------------------------------|
| Overall Success Rate  | 400%  | ⚠️ Likely data anomaly         |
| Active Gages          | 1     | Currently in use               |
| Needs Attention       | 1     | Requires immediate review      |
| In Queue              | 0     | Awaiting calibration           |

## Status Breakdown

### ✅ Calibrated On Time
- **Count:** `4`
- **Success Rate:** `400%`
- **Trend:** `+5%`

### 🚚 Out for Calibration
- **Count:** `0`

### ⚠️ Calibration Due
- **Count:** `0`
- **Status:** No overdue items

### ⏰ Due Next 15 Days
- **Count:** `1`
- **Action:** Schedule technician

### 🗓️ Scheduled Gages
- **Count:** `0`
- **Trend:** `+8%`

## Status Summary

- **Scheduled:** `0`
- **Upcoming:** `1`
- **Out for Calibration:** `0`
- **Overdue:** `0`

## Priority Item

**High Priority (1)**  
- Gage requires immediate dispatch for calibration
## System Architecture

### Frontend
- **Framework**: React 18 + TypeScript
- **Bundler**: Vite with `@vitejs/plugin-react-swc`
- **Compiler**: [SWC](https://swc.rs) — **20x faster than Babel** (single-core), **70x faster** (4-core)
- **Styling**: Tailwind CSS
- **State**: Context API + `useReducer` (or Redux Toolkit)
- **Routing**: React Router v6

### Backend (Implied)
- RESTful API for gage, user, and workflow operations
- Authentication & RBAC enforcement
- File storage for manuals, certificates, incident attachments
- Email service for notifications

---


## Core Workflows

### Gage Lifecycle
1. **Creation**: Admin adds gage with serial, type, category
2. **Allocation**: Store Manager issues to user/department
3. **Usage**: Operator uses within limits
4. **Expiry**: System blocks use if overused or calibration expired
5. **Incident**: Operator reports damage with attachments
6. **Reallocation**: Plant HOD approves extension
7. **Calibration**: Calibration Manager updates status & certificate
8. **Retirement**: Gage marked retired after end-of-life

### Alert & Notification Flow
- On expiry → Operator sees popup
- On reallocation request → Plant HOD gets **in-app notification + email**
- On incident report → Plant HOD + Store Manager get **email with attachments**

---

## Directory Structure

```plaintext
GAGE-FX/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── docs/
│   ├── ui/
│   ├── layouts/
│   ├── pages/
│   │   ├── admin/
│   │   ├── operator/
│   │   ├── planthod/
│   │   └── cribmanager/
│   ├── forms/
│   └── routes/
│   ├── utils/

```

## API Services

The application interacts with a secure backend service through dedicated, role-scoped API modules to manage gage lifecycle operations, user access, and workflow orchestration.

### 🔐 Authentication API
- User login with role-based validation  
- JWT token issuance and refresh  
- Session timeout and secure logout  

### 📦 Gage Management API
- **Create/Read/Update gages** with full metadata (serial, type, category, manufacturer)  
- Attach **PDF manuals**, **reference images**, and **technical notes**  
- Manage gage **status**: Active, Issued, Out of Calibration, Retired  
- Fetch gages by **user assignment**, **department**, or **calibration due date**

### 🔄 Workflow APIs
- **Reallocation Requests**: Submit, approve, or reject extension requests  
- **Incident Reporting**: Create damage reports with multi-file attachments (images, videos, PDFs)  
- **Usage Logging**: Record gage usage count per operator session  
- **Calibration Updates**: Upload certificates, set next due date, update status

### 👥 User & Org Structure API
- Retrieve user profile and assigned gages  
- List users by **role** (Operator, Admin, Plant HOD, etc.)  
- Manage **organizational hierarchy**: Department → Function → Operation  
- Create and assign users (IT Admin only)

> 🛡️ All APIs enforce **Role-Based Access Control (RBAC)** — users can only access data and actions permitted by their role.

---

## Installation and Setup

### Prerequisites
- **Node.js** (v18 LTS or higher)  
- **npm** or **yarn**  
- Running **backend API service**   
- Git CLI

### Installation Steps
1. **Clone the repository**
   ```bash
   git clone https://github.com/SWAJYOT-TECHNOLOGIES-PVT-LTD/Continued-Gage-FX-UI.git
