/**
 * The product name lives here and nowhere else. Change this one string to rename the app.
 */
export const APP_NAME = "Guardian";

export const APP_TAGLINE = "A calm second opinion, whenever something feels off.";

/** Login accounts are created from a username, so usernames are mapped onto this domain. */
export const AUTH_EMAIL_DOMAIN = "accounts.guardian-companion.app";

export function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase().replace(/\s+/g, "")}@${AUTH_EMAIL_DOMAIN}`;
}
