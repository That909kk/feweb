# API Test Cases - Customer Management

## Overview
This document outlines minimal test cases for the **Customer** endpoints. The endpoints allow authorized clients to view, update, and deactivate customer accounts.
**Base URL**: `/api/v1/customer`

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

## GET /api/v1/customer/active - Retrieve Active Customers

### Test Case 1: Successfully Retrieve Active Customers
- **Test Case ID**: TC_CUSTOMER_001
- **Description**: Verify that an authorized request returns all active customers.
- **Preconditions**:
    - Client is authenticated with a valid token.
    - Client has permission to view customers.
- **Input**:
    - **Method**: `GET`
    - **URL**: `/api/v1/customer/active`
    - **Headers**:
      ```
      Authorization: Bearer <valid_token>
      ```
- **Expected Output**:
  ```json
  [
    {
      "customerId": "c1000001-0000-0000-0000-000000000001",
      "fullName": "John Doe",
      "email": "john.doe@example.com"
    },
    {
      "customerId": "c1000001-0000-0000-0000-000000000002",
      "fullName": "Mary Jones",
      "email": "mary.jones@example.com"
    }
  ]
  ```
- **Status Code**: `200 OK`

### Test Case 2: Unauthorized Access
- **Test Case ID**: TC_CUSTOMER_002
- **Description**: Verify that the request fails without authentication.
- **Preconditions**: None.
- **Input**:
    - **Method**: `GET`
    - **URL**: `/api/v1/customer/active`
    - No Authorization header.
- **Expected Output**: Error message indicating authentication required.
- **Status Code**: `401 Unauthorized`

---

## PUT /api/v1/customer/{customerId} - Update Customer

The request body includes:
- `avatar`
- `fullName`
- `isMale`
- `email`
- `birthdate`

### Test Case 3: Successfully Update Customer
- **Test Case ID**: TC_CUSTOMER_003
- **Description**: Verify that an authorized client can update an existing customer.
- **Preconditions**:
    - Client is authenticated with a valid token.
    - Client has permission to modify customers.
    - Customer with the specified ID exists.
- **Input**:
    - **Method**: `PUT`
    - **URL**: `/api/v1/customer/c1000001-0000-0000-0000-000000000001`
    - **Headers**:
      ```
      Authorization: Bearer <valid_token>
      Content-Type: application/json
      ```
    - **Body**:
      ```json
      {
        "avatar": "https://example.com/avatar.jpg",
        "fullName": "John A. Doe",
        "isMale": true,
        "email": "john.doe@example.com",
        "birthdate": "2003-09-10"
      }
      ```
- **Expected Output**:
  ```json
  {
    "customerId": "c1000001-0000-0000-0000-000000000001",
    "avatar": "https://example.com/avatar.jpg",
    "fullName": "John A. Doe",
    "isMale": true,
    "email": "john.doe@example.com",
    "birthdate": "2003-09-10"
  }
  ```
- **Status Code**: `200 OK`

### Test Case 4: Validation Failure
- **Test Case ID**: TC_CUSTOMER_004
- **Description**: Verify that invalid data is rejected.
- **Preconditions**:
    - Client is authenticated with a valid token.
    - Client has permission to modify customers.
    - Customer with the specified ID exists.
- **Input**:
    - **Method**: `PUT`
    - **URL**: `/api/v1/customer/c1000001-0000-0000-0000-000000000001`
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
        "isMale": true,
        "email": "invalid-email",
        "birthdate": "2003-09-10"
      }
      ```
- **Expected Output**: Error message indicating validation failure for `fullName` and `email`.
- **Status Code**: `400 Bad Request`

### Test Case 5: Forbidden Access
- **Test Case ID**: TC_CUSTOMER_005
- **Description**: Verify that a user without sufficient permissions cannot update a customer.
- **Preconditions**:
    - Client is authenticated with a valid token.
    - Client lacks permission to modify customers.
    - Customer with the specified ID exists.
- **Input**:
    - **Method**: `PUT`
    - **URL**: `/api/v1/customer/c1000001-0000-0000-0000-000000000001`
    - **Headers**:
      ```
      Authorization: Bearer <token_without_permission>
      Content-Type: application/json
      ```
    - **Body**:
      ```json
      {
        "avatar": "https://example.com/avatar.jpg",
        "fullName": "John A. Doe",
        "isMale": true,
        "email": "john.doe@example.com",
        "birthdate": "2003-09-10"
      }
      ```
- **Expected Output**: Error message indicating insufficient permissions.
- **Status Code**: `403 Forbidden`

---

## PUT /api/v1/customer/{customerId}/deactivate - Deactivate Customer

### Test Case 6: Successfully Deactivate Customer
- **Test Case ID**: TC_CUSTOMER_006
- **Description**: Verify that an authorized client can deactivate a customer.
- **Preconditions**:
    - Client is authenticated with a valid token.
    - Client has permission to modify customers.
    - Customer with the specified ID exists.
- **Input**:
    - **Method**: `PUT`
    - **URL**: `/api/v1/customer/c1000001-0000-0000-0000-000000000001/deactivate`
    - **Headers**:
      ```
      Authorization: Bearer <valid_token>
      ```
- **Expected Output**:
  ```json
  {
    "customerId": "c1000001-0000-0000-0000-000000000001",
    "status": "INACTIVE"
  }
  ```
- **Status Code**: `200 OK`

### Test Case 7: Forbidden Access
- **Test Case ID**: TC_CUSTOMER_007
- **Description**: Verify that a user without sufficient permissions cannot deactivate a customer.
- **Preconditions**:
    - Client is authenticated with a valid token.
    - Client lacks permission to modify customers.
    - Customer with the specified ID exists.
- **Input**:
    - **Method**: `PUT`
    - **URL**: `/api/v1/customer/c1000001-0000-0000-0000-000000000001/deactivate`
    - **Headers**:
      ```
      Authorization: Bearer <token_without_permission>
      ```
- **Expected Output**: Error message indicating insufficient permissions.
- **Status Code**: `403 Forbidden`

---

## Notes
- These test cases are minimal and can be expanded with additional scenarios.
- Ensure the test environment includes representative customer data from `housekeeping_service_v8.sql`.