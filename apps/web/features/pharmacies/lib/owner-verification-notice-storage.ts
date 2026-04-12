export type OwnerVerificationNoticeScope = "dashboard" | "storefront"

/** Scoped so dismissing on the dashboard does not suppress the storefront preview notice (and vice versa). */
export function ownerVerificationNoticeStorageKey(
	pharmacyId: string,
	scope: OwnerVerificationNoticeScope = "dashboard"
) {
	return `mf:owner-pharmacy-verify-notice:${scope}:${pharmacyId}`
}
