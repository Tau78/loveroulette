export type RegistrationContactField =
  | "firstName"
  | "lastName"
  | "phone"
  | "email";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function invalidRegistrationContactFields(input: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}): RegistrationContactField[] {
  const invalid: RegistrationContactField[] = [];
  if (!input.firstName.trim()) invalid.push("firstName");
  if (!input.lastName.trim()) invalid.push("lastName");
  if (input.phone.trim().length < 6) invalid.push("phone");
  if (!EMAIL_PATTERN.test(input.email.trim())) invalid.push("email");
  return invalid;
}
