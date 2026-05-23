# DriveCare Vehicle Management System

## 1. Project Overview
DriveCare is a mobile-first vehicle management application built to help everyday vehicle owners manage maintenance, fuel spending, documents, safety, and sustainability from one place. The project combines a React Native Expo frontend with a Node.js + Express + MongoDB backend.

At a practical level, the app acts like a digital vehicle assistant. Instead of users tracking fuel bills, maintenance history, document expiry, emergency contacts, and basic health indicators across different apps or paper records, DriveCare brings them into a single workflow.

## 2. Main Goal of the App
The main goal of DriveCare is to reduce the everyday friction of owning and maintaining a vehicle by making vehicle care:
- organized,
- proactive,
- safer,
- more cost-aware, and
- more environmentally responsible.

## 3. Target Users
DriveCare is useful for:
- individual car and bike owners,
- families managing multiple vehicles,
- commuters who want to monitor fuel spending,
- users who forget service schedules or document renewals,
- drivers who want a quick-access emergency SOS feature,
- eco-conscious users who want to measure efficiency improvements.

## 4. Technology Stack
### Frontend
- React Native with Expo
- React Navigation
- AsyncStorage for session persistence
- Axios for backend API calls
- Expo Location for SOS GPS sharing

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT-based authentication
- Twilio API support for emergency SMS alerts

## 5. Core Features
### 5.1 Authentication and User Accounts
Users can:
- register with name, email, and password,
- log in securely,
- stay signed in using local token storage,
- update profile details,
- change password,
- manage emergency contacts.

### 5.2 Vehicle Management
Users can:
- add one or more vehicles,
- store make, model, year, plate number, odometer, fuel type, and color,
- update vehicle details,
- delete vehicles,
- mark one vehicle as the primary vehicle.

### 5.3 Fuel Tracking
Users can:
- log each fuel refill,
- store fuel amount, cost, and odometer,
- view fuel history,
- track total spending,
- estimate average fuel efficiency from logged entries.

### 5.4 Service and Maintenance Logs
Users can:
- record maintenance activities,
- store service type and notes,
- view service history,
- keep a running maintenance record for each vehicle.

### 5.5 Vehicle Health Monitoring
The app provides a simplified vehicle health dashboard with:
- health status,
- battery percentage,
- driving range,
- tire pressure state,
- odometer visibility.

This gives users a quick snapshot of the vehicle's condition in one screen.

### 5.6 Document Tracking
Users can:
- store document metadata such as insurance or registration,
- add expiry dates,
- identify expired documents visually,
- use the app as a digital glovebox for important vehicle records.

### 5.7 SOS Emergency Assistance
Users can:
- save up to 5 emergency contacts,
- trigger SOS after a short countdown to avoid accidental activation,
- send SMS alerts with live GPS coordinates,
- keep sharing live location updates while SOS is active,
- stop SOS when the emergency ends,
- view recent SOS history.

### 5.8 Eco Impact Tracking
Users can:
- log improvements in fuel efficiency after servicing,
- estimate fuel saved,
- calculate CO2 reduction,
- convert impact into tree-equivalent savings,
- build an eco score and badge over time.

## 6. Real-World Problems Solved by the App
### Problem 1: Vehicle information is scattered
In real life, vehicle owners often keep service records, fuel notes, insurance reminders, and registration details in different places.

DriveCare solves this by centralizing vehicle operations into one app.

### Problem 2: People forget maintenance schedules
Many users miss servicing because reminders are informal or written down elsewhere.

DriveCare solves this by keeping service history visible and surfacing maintenance-focused workflows in the app.

### Problem 3: Fuel spending is hard to track accurately
Vehicle owners usually know they spend a lot on fuel, but they do not know how much over time.

DriveCare solves this by logging refill cost, amount, and odometer to create spending and efficiency visibility.

### Problem 4: Important documents expire unnoticed
Insurance, registration, pollution checks, and other documents are easy to forget until they expire.

DriveCare solves this by storing document titles and expiry dates in a dedicated vehicle document area.

### Problem 5: Emergency response is too slow in stressful situations
In emergencies, drivers may not have time to manually call or message multiple people and explain their location.

DriveCare solves this with an SOS workflow that sends alerts and shares a live map link with saved contacts.

### Problem 6: Drivers lack simple vehicle health visibility
Not all users understand technical diagnostics, but they still need a quick overview of the vehicle's condition.

DriveCare solves this with a simple dashboard for health status, battery, range, tire pressure, and odometer.

### Problem 7: Environmental impact is invisible to normal users
Most drivers do not know whether better servicing or improved fuel efficiency is reducing emissions.

DriveCare solves this by converting maintenance-driven efficiency gains into understandable eco metrics like CO2 saved and tree equivalents.

### Problem 8: Multi-vehicle households need better organization
Families or users with more than one vehicle need a structured way to manage each vehicle separately.

DriveCare solves this with per-vehicle records and a primary vehicle workflow.

## 7. Business / Practical Value
DriveCare creates value by:
- improving user safety through SOS alerts,
- reducing maintenance neglect,
- improving fuel cost awareness,
- lowering the chance of document expiry issues,
- supporting better long-term vehicle care,
- encouraging sustainable driving behavior.

## 8. High-Level System Flow
1. User signs up or logs in.
2. User adds one or more vehicles.
3. User logs fuel, service, document, and eco entries against a vehicle.
4. User reviews dashboards for home, health, fuel, maintenance, and eco insights.
5. In emergencies, user triggers SOS and the backend records and sends alerts.

## 9. Current Functional Modules in This Project
Based on the current codebase, the project already includes:
- auth module,
- profile module,
- vehicle CRUD module,
- fuel log module,
- service log module,
- document log module,
- eco impact module,
- SOS contacts and SOS history module,
- mobile navigation and dashboard screens.

## 10. Suggested Short Project Description
DriveCare is a smart vehicle management app that helps users manage vehicles, monitor fuel usage, record maintenance, track document expiry, view vehicle health, trigger SOS alerts, and measure eco impact from better vehicle care.
