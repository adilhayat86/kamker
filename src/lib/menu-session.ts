export type MenuSession = {
  professionalLoggedIn: boolean;
  customerLoggedIn: boolean;
  adminAuthenticated: boolean;
};

export const guestMenuSession: MenuSession = {
  professionalLoggedIn: false,
  customerLoggedIn: false,
  adminAuthenticated: false,
};

export function menuSessionFromResponse(value: unknown): MenuSession {
  if (!value || typeof value !== "object") return guestMenuSession;
  const session = value as Record<string, unknown>;
  const professionalLoggedIn = session.professionalLoggedIn === true;
  const customerLoggedIn = session.customerLoggedIn === true;
  return {
    professionalLoggedIn,
    customerLoggedIn,
    // Public accounts take precedence if an older admin cookie is also present.
    adminAuthenticated: session.adminAuthenticated === true && !professionalLoggedIn && !customerLoggedIn,
  };
}

// Menu presentation only: admin routes/actions independently validate the session.
export function canShowAdminMenu(pathname: string, session: MenuSession): boolean {
  const inAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");
  return inAdminArea && session.adminAuthenticated && !session.professionalLoggedIn && !session.customerLoggedIn;
}
