/**
 * Philippine mobile numbers: fixed prefix +63 09, then exactly 9 digits.
 * Stored compact form: +6309XXXXXXXXX (no spaces).
 */

export const PH_MOBILE_PREFIX_DISPLAY = "+63 09 "

/** Nine subscriber digits after the literal "09" (national trunk). */
export function extractPhMobileNineDigits(raw: string): string {
	const d = raw.replace(/\D/g, "")
	if (!d) return ""

	if (d.startsWith("6309")) {
		return d.slice(4, 13)
	}
	if (d.startsWith("63")) {
		if (d.length < 4) return ""
		if (d[2] === "0" && d[3] === "9") {
			return d.slice(4, 13)
		}
		if (d[2] === "9" && d.length >= 12) {
			return d.slice(3, 12)
		}
		return ""
	}
	if (d.startsWith("09")) {
		return d.slice(2, 11)
	}
	if (d[0] === "9" && d.length >= 10 && !d.startsWith("63")) {
		return d.slice(1, 10)
	}
	return d.slice(0, 9)
}

export function maskPhMobileInput(raw: string): string {
	const t = raw.trim()
	if (!t) return ""
	const nine = extractPhMobileNineDigits(raw)
	return PH_MOBILE_PREFIX_DISPLAY + nine
}

export function phMobileDisplayToStored(display: string): string | undefined {
	const nine = extractPhMobileNineDigits(display)
	if (nine.length === 0) return undefined
	if (nine.length !== 9) return undefined
	return `+6309${nine}`
}

export function phMobileStoredToDisplay(stored: string | null | undefined): string {
	if (!stored?.trim()) return ""
	const compact = stored.replace(/\s/g, "")
	const m = compact.match(/^\+?6309(\d{9})$/u)
	if (m) return PH_MOBILE_PREFIX_DISPLAY + m[1]
	return maskPhMobileInput(stored)
}

export function isCompletePhMobileDisplay(display: string): boolean {
	return /^\+63 09 \d{9}$/.test(display)
}

/** Optional field: no subscriber digits yet, or exactly nine (complete). */
export function isValidOptionalPhMobileDisplay(display: string): boolean {
	const nine = extractPhMobileNineDigits(display)
	return nine.length === 0 || nine.length === 9
}
