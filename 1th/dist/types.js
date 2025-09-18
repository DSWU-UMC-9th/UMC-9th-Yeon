export function assertNever(x) {
    throw new Error(`Unreachable: ${x}`);
}
