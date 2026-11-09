// Mongoose lean() still contains BSON ObjectIds and dates. Round-trip the entire
// props tree, including populated references and Mixed settings, before RSC.
export function toClientData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
