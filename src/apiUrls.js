const BASE_URL = import.meta.env.DEV 
  ? "/api"
  : import.meta.env.VITE_API_BASE_URL;

export const superAdminUrl   = `${BASE_URL}/admin/masters/`;
export const adminUrl        = `${BASE_URL}/admin/push/`;
export const salonsUrl       = `${BASE_URL}/admin/salons/`;
export const appointUrl      = `${BASE_URL}/appointments`;
export const commentsUrl     = `${BASE_URL}/feedbacks/`;
export const mastersUrl      = `${BASE_URL}/masters/`;
export const servicesUrl     = `${BASE_URL}/promotions/`;
export const salonsListUrl   = `${BASE_URL}/salons/`;
export const schedulesUrl    = `${BASE_URL}/schedules/`;
export const salonServicesUrl= `${BASE_URL}/services/`;
export const statisticsUrl   = `${BASE_URL}/statistics/`;
