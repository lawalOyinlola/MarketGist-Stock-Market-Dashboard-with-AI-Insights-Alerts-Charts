//  Utility for managing guest user state in localStorage

const GUEST_EMAIL_KEY = "marketgist_guest_email";
const GUEST_EMAIL_PROVIDED_KEY = "marketgist_guest_email_provided";

export const guestStorage = {
  //   Get the guest email from localStorage
  getGuestEmail: (): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(GUEST_EMAIL_KEY);
    } catch (error) {
      console.error("Error getting guest email:", error);
      return null;
    }
  },

  //   Set the guest email in localStorage
  setGuestEmail: (email: string): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(GUEST_EMAIL_KEY, email);
      localStorage.setItem(GUEST_EMAIL_PROVIDED_KEY, "true");
    } catch (error) {
      console.error("Error setting guest email:", error);
    }
  },

  //   Clear the guest email from localStorage
  clearGuestEmail: (): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(GUEST_EMAIL_KEY);
      localStorage.removeItem(GUEST_EMAIL_PROVIDED_KEY);
    } catch (error) {
      console.error("Error clearing guest email:", error);
    }
  },

  //    Check if guest has provided email
  hasProvidedEmail: (): boolean => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(GUEST_EMAIL_PROVIDED_KEY) === "true";
    } catch (error) {
      console.error("Error checking if email provided:", error);
      return false;
    }
  },

  //    Get the guest userId (email for guest users)
  getGuestUserId: (): string | null => {
    return guestStorage.getGuestEmail();
  },
};
