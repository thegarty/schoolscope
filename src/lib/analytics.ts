// Google Analytics utility functions for tracking events throughout the app

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

const GA_TRACKING_ID = 'G-CKNHZ41L7J';

// Initialize gtag function if not already available
if (typeof window !== 'undefined' && !window.gtag) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(...args: any[]) {
    window.dataLayer.push(args);
  };
}

/**
 * Track page views for client-side navigation
 */
export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

/**
 * Track custom events
 */
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

/**
 * Track user authentication events
 */
export const trackAuth = (action: 'login' | 'logout' | 'register', method?: string) => {
  trackEvent(action, 'Authentication', method);
};

/**
 * Track school-related events
 */
export const trackSchool = (
  action: 'view' | 'search' | 'edit' | 'vote' | 'create_event',
  schoolId?: string,
  schoolName?: string
) => {
  trackEvent(action, 'School', schoolName || schoolId);
};

/**
 * Track event-related actions
 */
export const trackEventAction = (
  action: 'view' | 'create' | 'edit' | 'delete' | 'confirm' | 'export' | 'unconfirm',
  eventId?: string,
  eventName?: string,
  isPublic?: boolean
) => {
  trackEvent(action, 'Event', eventName || eventId, isPublic ? 1 : 0);
};

/**
 * Track child profile actions
 */
export const trackChild = (
  action: 'add' | 'edit' | 'delete' | 'view',
  childId?: string
) => {
  trackEvent(action, 'Child', childId);
};

/**
 * Track calendar actions
 */
export const trackCalendar = (
  action: 'export' | 'view' | 'filter',
  format?: 'google' | 'outlook' | 'apple' | 'ics'
) => {
  trackEvent(action, 'Calendar', format);
};

/**
 * Track admin actions
 */
export const trackAdmin = (
  action: string,
  resource?: string,
  resourceId?: string
) => {
  trackEvent(action, 'Admin', `${resource}${resourceId ? `:${resourceId}` : ''}`);
};

/**
 * Track search queries
 */
export const trackSearch = (
  query: string,
  resultsCount?: number,
  type?: 'school' | 'event'
) => {
  trackEvent('search', 'Search', type || 'general', resultsCount);
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'search', {
      search_term: query,
      results_count: resultsCount,
      search_type: type,
    });
  }
};

/**
 * Track form submissions
 */
export const trackForm = (
  formName: string,
  action: 'submit' | 'error' | 'success',
  errorMessage?: string
) => {
  trackEvent(action, 'Form', formName);
  if (action === 'error' && errorMessage) {
    trackEvent('form_error', 'Form', `${formName}: ${errorMessage}`);
  }
};

/**
 * Track email actions
 */
export const trackEmail = (
  action: 'send' | 'open' | 'click' | 'unsubscribe',
  emailType?: string
) => {
  trackEvent(action, 'Email', emailType);
};

/**
 * Track voting actions
 */
export const trackVote = (
  action: 'vote' | 'approve' | 'reject',
  resourceType: 'school_edit' | 'event',
  resourceId?: string
) => {
  trackEvent(action, 'Vote', `${resourceType}${resourceId ? `:${resourceId}` : ''}`);
};

/**
 * Track errors
 */
export const trackError = (error: Error | string, context?: string) => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  trackEvent('error', 'Error', context || errorMessage);
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'exception', {
      description: errorMessage,
      fatal: false,
      context: context,
    });
  }
};

/**
 * Track user engagement metrics
 */
export const trackEngagement = (
  action: 'time_on_page' | 'scroll_depth' | 'click',
  value?: number
) => {
  trackEvent(action, 'Engagement', undefined, value);
};

/**
 * Track conversion events
 */
export const trackConversion = (
  conversionType: 'signup' | 'event_created' | 'event_confirmed' | 'school_edit_approved',
  value?: number
) => {
  trackEvent('conversion', 'Conversion', conversionType, value);
};

