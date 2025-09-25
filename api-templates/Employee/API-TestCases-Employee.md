# API Test Cases - Employee Management

## Overview
This document outlines minimal test cases for the **Employee** endpoints. The endpoints allow authorized clients to view and modify employee information.
**Base URL**: `/api/v1/employee`

---

## Test Case Structure
Each test case includes:
- **Test Case ID**
- **Description**
- **Preconditions**
- **Input**
- **Expected Output**
- **Status Code**

---

## GET /api/v1/employee/ - Retrieve Employees

### Test Case 1: Successfully Retrieve All Employees
- **Test Case ID**: TC_EMPLOYEE_001
- **Description**: Verify that an authorized request returns the list of employees.
- **Preconditions**:
  - Client is authenticated with a valid token.
  - Client has permission to view employees.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/employee/`
  - **Headers**:
    ```
    Authorization: Bearer <valid_token>
    ```
- **Expected Output**:
  ```json
  [
    {
      "employeeId": "e1000001-0000-0000-0000-000000000001",
      "fullName": "Jane Smith",
      "email": "jane.smith@example.com",
      "skills": ["Cleaning", "Organizing"]
    },
    {
      "employeeId": "e1000001-0000-0000-0000-000000000002",
      "fullName": "Bob Wilson",
      "email": "bob.wilson@examplefieldset.com",
      "skills": ["Deep Cleaning", "Laundry"]
    }
  ]
  ```
- **Status Code**: `200 OK`

### Test Case 2: Unauthorized Access
- **Test Case ID**: TC_EMPLOYEE_002
- **Description**: Verify that the request fails without authentication.
- **Preconditions**: None.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/employee/`
  - No Authorization header.
- **Expected Output**: Error message indicating authentication required.
- **Status Code**: `401 Unauthorized`

---

## PUT /api/v1/employee/{employeeId} - Update Employee

The request body includes all of the following fields:
- `avatar`
- `fullName`
- `isMale`
- `email`
- `birthdate`
- `hiredDate`
- `skills` (array of strings)
- `bio`
- `rating`
- `employeeStatus`

### Test Case 3: Successfully Update Employee
- **Test Case ID**: TC_EMPLOYEE_003
- **Description**: Verify that an authorized client can update an existing employee.
- **Preconditions**:
  - Client is authenticated with a valid token.
  - Client has permission to modify employees.
  - Employee with the specified ID exists.
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/employee/e1000001-0000-0000-0000-000000000001`
  - **Headers**:
    ```
    Authorization: Bearer <valid_token>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "avatar": "https://example.com/avatar.jpg",
      "fullName": "Jane A. Smith",
      "isMale": false,
      "email": "jane.smith@example.com",
      "birthdate": "1990-05-20",
      "hiredDate": "2020-03-15",
      "skills": ["Cleaning", "Organizing", "Cooking"],
      "bio": "Senior housekeeper",
      "rating": "AVERAGE",
      "employeeStatus": "AVAILABLE"
    }
    ```
- **Expected Output**:
  ```json
  {
    "employeeId": "e1000001-0000-0000-0000-000000000001",
    "avatar": "https://example.com/avatar.jpg",
    "fullName": "Jane A. Smith",
    "isMale": false,
    "email": "jane.smith@example.com",
    "birthdate": "1990-05-20",
    "hiredDate": "2020-03-15",
    "skills": ["Cleaning", "Organizing", "Cooking"],
    "bio": "Senior housekeeper",
    "rating": "AVERAGE",
    "employeeStatus": "AVAILABLE"
  }
  ```
- **Status Code**: `200 OK`

### Test Case 4: Validation Failure
- **Test Case ID**: TC_EMPLOYEE_004
- **Description**: Verify that invalid data is rejected.
- **Preconditions**:
  - Client is authenticated with a valid token.
  - Client has permission to modify employees.
  - Employee with the specified ID exists.
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/employee/e1000001-0000-0000-0000-000000000001`
  - **Headers**:
    ```
    Authorization: Bearer <valid_token>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "avatar": "https://example.com/avatar.jpg",
      "fullName": "",
      "isMale": false,
      "email": "invalid-email",
      "birthdate": "1990-05-20",
      "hiredDate": "2020-03-15",
      "skills": ["Cleaning", "Organizing", "Cooking"],
      "bio": "Senior housekeeper",
      "rating": "AVERAGE",
      "employeeStatus": "AVAILABLE"
    }
    ```
- **Expected Output**: Error message indicating validation failure for `fullName` and `email`.
- **Status Code**: `400 Bad Request`

### Test Case 5: Forbidden Access
- **Test Case ID**: TC_EMPLOYEE_005
- **Description**: Verify that a user without sufficient permissions cannot update an employee.
- **Preconditions**:
  - Client is authenticated with a valid token.
  - Client lacks permission to modify employees.
  - Employee with the specified ID exists.
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/employee/e1000001-0000-0000-0000-000000000001`
  - **Headers**:
    ```
    Authorization: Bearer <token_without_permission>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "avatar": "https://example.com/avatar.jpg",
      "fullName": "Jane A. Smith",
      "isMale": false,
      "email": "jane.smith@example.com",
      "birthdate": "1990-05-20",
      "hiredDate": "2020-03-15",
      "skills": ["Cleaning", "Organizing", "Cooking"],
      "bio": "Senior housekeeper",
      "rating": "AVERAGE",
      "employeeStatus": "AVAILABLE"
    }
    ```
- **Expected Output**: Error message indicating insufficient permissions.
- **Status Code**: `403 Forbidden`

---

## Notes
- These test cases are high-level and may be expanded with additional fields and scenarios.
- Ensure the test environment contains representative employee data.