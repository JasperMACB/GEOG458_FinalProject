# Seattle Parking & Traffic Dashboard  
**GEOG 458 Final Project**
by Tommy Tsui, Jasper Crossley Blasio, Jiaxuan Su, Ryan V Contreras

##### AI Disclosure:
AI was only used for help debugging html, we did not use AI to write or complete any components where AI use is prohibited. If AI was used for debugging or development, we are able to explain the relevant code and decisions.

---

## [Link to the Map](https://jaspermacb.github.io/GEOG458_FinalProject/) 

---

## Overview
This project is an interactive geospatial dashboard that visualizes parking facilities, traffic flow, and residential parking restrictions in Seattle. The goal is to help users explore how parking supply, road congestion, and regulatory policies interact across the city.

The dashboard allows users to interact with multiple spatial datasets through a web-based map. By clicking on different features such as parking garages, surface lots, traffic segments, or restricted parking zones, users can zoom into specific locations and view detailed information in the dashboard panel.

This project demonstrates how multiple geospatial datasets can be combined into a single interface to support exploration of urban mobility and parking infrastructure.

---

## Project Goals
The main objectives of this project are to:

- Visualize **public parking facilities** across Seattle
- Distinguish **parking garages vs. surface lots**
- Display **traffic flow intensity** on city streets
- Show **Restricted Parking Zone (RPZ)** areas
- Allow users to interactively explore the data through map clicks and dashboard updates

The dashboard provides a simple way to understand how parking infrastructure and road traffic patterns relate spatially.

---

## Data Sources

All datasets are obtained from **Seattle Open Data**.

### 1. Public Garages and Parking Lots
Source: Seattle Department of Transportation

This dataset contains the location of public parking facilities in Seattle, including both garages and surface parking lots.

Key attributes used in the project include:

- **DEA_FACILITY_NAME** – name of the parking facility  
- **DEA_FACILITY_ADDRESS** – street address  
- **DEA_STALLS** – number of parking stalls  
- **RTE_1HR** – hourly parking rate  
- **FAC_TYPE** – facility type (Garage or Surface Lot)

These features are displayed as circles on the map, with the size representing the number of parking stalls.

---

### 2. Traffic Flow Counts
Source: Seattle Department of Transportation

This dataset contains traffic volume counts for road segments throughout the city.

Key attributes include:

- **STNAME_ORD** – street name  
- **AWDT** – Average Weekday Daily Traffic  
- **AMPK** – morning peak traffic volume  
- **PMPK** – evening peak traffic volume  

Traffic flow is visualized as colored lines on the map, where the color indicates the intensity of daily traffic.

---

### 3. Restricted Parking Zone Areas
Source: Seattle Department of Transportation

Restricted Parking Zones (RPZ) are areas where parking is regulated to prioritize residents.

Key attributes include:

- **NAME** – RPZ area name  
- **RPZ_ZONE** – zone identifier  
- **INEFFECT** – regulation status  
- **RENEW** – renewal information  
- **SUBSIDIES** – subsidy availability  

These zones are displayed as semi-transparent polygons on the map.

---

## Features

### Interactive Map
The map is built using **Mapbox GL JS** and allows users to explore spatial data dynamically.

Users can:
- Zoom and pan across the Seattle area
- Click features to zoom into them
- Toggle map layers on and off

---

### Layer Controls
Users can choose which layers to display using the layer control panel.

Available layers include:

- Parking Facilities
- Traffic Flow
- Restricted Parking Zones

---

### Feature Details Panel
When a user clicks on a feature, the dashboard updates to display relevant information.

Examples:

**Parking facility**
- Facility name
- Address
- Parking stalls
- Parking rate
- Facility type

**Traffic segment**
- Street name
- Average daily traffic
- Peak traffic volumes

**Restricted parking zone**
- Zone name
- RPZ identifier
- Renewal information

---

### Parking Dashboard Chart
The dashboard includes a bar chart that summarizes parking lot sizes based on stall capacity.

Categories include:

- 0–50 stalls  
- 51–200 stalls  
- 201–500 stalls  
- 500+ stalls  

The chart dynamically updates based on the current map view.

---

### Parking Facility Classification
Parking facilities are visually distinguished by type:

| Facility Type | Color |
|---------------|------|
| Garage | Blue |
| Surface Lot | Orange |
| Others | Gray |

This helps users quickly identify different parking facility types on the map.

---
## Key Insights

By combining parking infrastructure, traffic patterns, and parking regulation zones, the dashboard allows users to observe several spatial patterns:

- Downtown Seattle contains the **highest density of parking garages**
- Major roads show **higher traffic volumes**
- Residential neighborhoods have **more restricted parking zones**

These layers together provide a clearer picture of Seattle’s urban mobility landscape.

---

## Future Improvements

Potential improvements for the project include:

- Adding parking **rate filtering**
- Highlighting selected features on the map
- Calculating **average parking cost per neighborhood**
- Integrating public transit accessibility data
- Adding commute-time analysis

---

## About US

The members of Group 19 are:

- **Tommy Tsui**
- **Jasper Crossley Blasio**
- **Jiaxuan Su**
- **Ryan V Contreras**

Our instructors are:

- **Professor Bo Zhao**
- **TA Alex Kirchmeier**

---

GEOG 458 Final Project Group 19 
University of Washington
