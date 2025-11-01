import React from 'react';
import { useLocation } from 'react-router-dom';
import { RouteAccessMapping } from './SLAData';
import AccessDenied from './Pages/AccessDenied/AccessDenied';

const AccessControlRoute = ({ children, userAccess }) => {
  const location = useLocation();
  
  // If userAccess is empty (admin/full access), allow access to all routes
  if (userAccess.length === 0) {
    return children;
  }

  // Get required access for the current path
  const getRequiredAccess = (path) => {
    // Check exact match first
    if (RouteAccessMapping[path] !== undefined) {
      return RouteAccessMapping[path];
    }
    
    // Check for wildcard matches and dynamic routes
    for (const route in RouteAccessMapping) {
      if (route.includes('/*')) {
        const baseRoute = route.replace('/*', '');
        if (path.startsWith(baseRoute + '/') || path === baseRoute) {
          return RouteAccessMapping[route];
        }
      }
      // Check for dynamic route patterns like /employees/:employeeId
      if (route.includes('/:')) {
        const routeParts = route.split('/');
        const pathParts = path.split('/');
        
        if (routeParts.length === pathParts.length) {
          const matches = routeParts.every((part, index) => {
            return part.startsWith(':') || part === pathParts[index];
          });
          
          if (matches) {
            return RouteAccessMapping[route];
          }
        }
      }
    }
    
    // If no mapping found, check base route
    const basePath = '/' + path.split('/')[1];
    if (RouteAccessMapping[basePath] !== undefined) {
      return RouteAccessMapping[basePath];
    }
    
    // If still no mapping found, deny access (safe default)
    return 'unknown';
  };

  const requiredAccess = getRequiredAccess(location.pathname);
  
  // If no specific access required (null), allow access
  if (requiredAccess === null) {
    return children;
  }

  // Check if the user has access to the required route
  if (requiredAccess && !userAccess.includes(requiredAccess)) {
    return <AccessDenied />;
  }

  return children;
};

export default AccessControlRoute;