export function profileDetails(input: { name?: unknown; phone?: unknown }) {
  const result: { name?: string; phone?: string } = {};
  if (input.name !== undefined) {
    if (typeof input.name !== "string" || input.name.trim().length < 2 || input.name.trim().length > 100)
      throw new Error("Enter a name between 2 and 100 characters.");
    result.name = input.name.trim();
  }
  if (input.phone !== undefined) {
    if (typeof input.phone !== "string") throw new Error("Enter a valid phone number.");
    const phone = input.phone.trim();
    if (phone && (!/^\+?[\d\s().-]+$/.test(phone) || phone.replace(/\D/g, "").length < 7 || phone.replace(/\D/g, "").length > 15 || phone.length > 30))
      throw new Error("Enter a valid phone number with country code.");
    result.phone = phone;
  }
  return result;
}
