// Production server URL
const BASE_URL = "https://freya-salon-backend-cc373ce6622a.herokuapp.com/api";

// Authentication endpoints
export const authUrl         = `${BASE_URL}/auth`;
export const adminLoginUrl   = `${BASE_URL}/auth/admin/login`;
export const employeeLoginUrl= `${BASE_URL}/auth/employee/login`;
export const superAdminLoginUrl = `${BASE_URL}/auth/superadmin/login`;
export const adminCreateUrl  = `${BASE_URL}/auth/admin/create`;
export const adminProfileUrl = `${BASE_URL}/auth/admin/profile`;

// Admin endpoints
export const adminUrl        = `${BASE_URL}/admin`;
export const adminSalonsUrl  = `${BASE_URL}/admin/salons`;
export const adminMySalonUrl = `${BASE_URL}/admin/my-salon`;
export const adminSalonTopUrl = `${BASE_URL}/admin/salon/top`;
export const adminTopSalonsUrl = `${BASE_URL}/admin/salons/top`;
export const adminSalonTopHistoryUrl = `${BASE_URL}/admin/salon`;

// User endpoints
export const usersUrl        = `${BASE_URL}/users`;
export const userRegisterStep1Url = `${BASE_URL}/users/register/step1`;
export const userRegisterStep2Url = `${BASE_URL}/users/register/step2`;
export const userVerifyPhoneUrl = `${BASE_URL}/users/verify-phone`;
export const userLoginUrl    = `${BASE_URL}/users/login`;
export const userPasswordResetSendCodeUrl = `${BASE_URL}/users/password-reset/send-code`;
export const userResetPasswordUrl = `${BASE_URL}/users/reset-password`;
export const userPhoneChangeSendCodeUrl = `${BASE_URL}/users/phone-change/send-code`;
export const userPhoneChangeVerifyUrl = `${BASE_URL}/users/phone-change/verify`;
export const userDeleteUrl   = `${BASE_URL}/users/delete`;
export const userUpdateUrl   = `${BASE_URL}/users/update`;
export const userGenerateTokenUrl = `${BASE_URL}/users/generate-token`;
export const userLocationUrl = `${BASE_URL}/users/location`;
export const userProfileUrl  = `${BASE_URL}/users/profile`;
export const userProfileImageUploadUrl = `${BASE_URL}/users/profile/image/upload`;
export const userProfileImageDeleteUrl = `${BASE_URL}/users/profile/image`;
export const userFavouritesUrl = `${BASE_URL}/users/favourites`;
export const userFavouritesAddUrl = `${BASE_URL}/users/favourites/add`;
export const userFavouritesRemoveUrl = `${BASE_URL}/users/favourites/remove`;
export const userPaymentCardsUrl = `${BASE_URL}/users/payment-cards`;

// Employee endpoints  
export const employeesUrl    = `${BASE_URL}/employees`;
export const mastersUrl      = `${BASE_URL}/employees`; // Masters are employees
export const employeeSalonUrl = `${BASE_URL}/employees/salon`;
export const employeeCommentsUrl = `${BASE_URL}/employees`;
export const employeePostsUrl = `${BASE_URL}/employees`;
export const employeeWaitingStatusUrl = `${BASE_URL}/employees`;
export const employeeBulkWaitingStatusUrl = `${BASE_URL}/employees/bulk/waiting-status`;

// Salon endpoints
export const salonsUrl       = `${BASE_URL}/salons`;
export const salonsListUrl   = `${BASE_URL}/salons`;
export const salonDetailUrl  = `${BASE_URL}/salons`;
// Alias for consistency in Context.jsx functions
export const salonUrl        = `${BASE_URL}/salons`;
export const salonCommentsUrl = `${BASE_URL}/salons`;
export const salonPhotosUrl  = `${BASE_URL}/salons`;
export const salonNearbyUrl  = `${BASE_URL}/salons/nearby`;
export const salonFilterTypesUrl = `${BASE_URL}/salons/filter/types`;

// Service endpoints
export const servicesUrl     = `${BASE_URL}/services`;
export const salonServicesUrl= `${BASE_URL}/services/salon`;

// Appointment endpoints
export const appointUrl      = `${BASE_URL}/appointments`;
export const appointmentsUrl = `${BASE_URL}/appointments`;
export const appointmentCancelUrl = `${BASE_URL}/appointments`;
export const appointmentStatusUrl = `${BASE_URL}/appointments`;
export const appointmentSalonUrl = `${BASE_URL}/appointments/salon`;
export const appointmentUserUrl = `${BASE_URL}/appointments/user/my-appointments`;

// Schedule endpoints
export const schedulesUrl    = `${BASE_URL}/schedules`;
export const scheduleGroupedUrl = `${BASE_URL}/schedules/grouped/by-date`;
export const scheduleSalonUrl = `${BASE_URL}/schedules/salon`;

// Payment endpoints
export const paymentUrl      = `${BASE_URL}/payment`;
export const paymentEmployeePostUrl = `${BASE_URL}/payment/employee-post`;
export const paymentUserPremiumUrl = `${BASE_URL}/payment/user-premium`;
export const paymentSalonTopUrl = `${BASE_URL}/payment/salon-top`;
export const paymentStatusUrl = `${BASE_URL}/payment/status`;
export const paymentCallbackUrl = `${BASE_URL}/payment/callback`;
export const paymentHistoryUrl = `${BASE_URL}/payment/history`;

// Alias to match Context.jsx usage for single service resource
export const serviceUrl      = `${BASE_URL}/services`;

// SMS endpoints
export const smsUrl          = `${BASE_URL}/sms`;
export const smsVerificationCodeUrl = `${BASE_URL}/sms/send-verification-code`;
export const smsResetPasswordCodeUrl = `${BASE_URL}/sms/send-reset-password-code`;
export const smsChangePhoneCodeUrl = `${BASE_URL}/sms/send-change-phone-code`;
export const smsRegistrationCodeUrl = `${BASE_URL}/sms/send-registration-code`;
export const smsPaymentCardCodeUrl = `${BASE_URL}/sms/send-payment-card-code`;
export const smsBalanceUrl   = `${BASE_URL}/sms/balance`;
export const smsStatusUrl    = `${BASE_URL}/sms/status`;
export const smsRefreshTokenUrl = `${BASE_URL}/sms/refresh-token`;

// Translation endpoints
export const translationUrl  = `${BASE_URL}/translation`;
export const translationTranslateUrl = `${BASE_URL}/translation/translate`;
export const translationTranslateAllUrl = `${BASE_URL}/translation/translate-all`;
export const translationDetectLanguageUrl = `${BASE_URL}/translation/detect-language`;
export const translationSupportedLanguagesUrl = `${BASE_URL}/translation/supported-languages`;
export const translationUsageUrl = `${BASE_URL}/translation/usage`;

// Comment/Feedback endpoints (part of salon endpoints)
export const commentsUrl     = `${BASE_URL}/salons`; // Comments are part of salon API

// Statistics endpoints (not implemented yet in backend)
export const statisticsUrl   = `${BASE_URL}/statistics`;

// Message endpoints (not implemented yet in backend)
export const messagesUrl     = `${BASE_URL}/messages`;
