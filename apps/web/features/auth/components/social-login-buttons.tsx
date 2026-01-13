import { Button } from "@/core/components/ui/button"
import { Field } from "@/core/components/ui/field"

import { AppleIcon, GoogleIcon, MetaIcon } from "./social-icons"

interface SocialLoginButtonsProps {
	action?: "login" | "signup"
	onAppleClick?: () => void
	onGoogleClick?: () => void
	onMetaClick?: () => void
}

export function SocialLoginButtons({
	action = "login",
	onAppleClick,
	onGoogleClick,
	onMetaClick,
}: SocialLoginButtonsProps) {
	const actionText = action === "login" ? "Login" : "Sign up"

	return (
		<Field className="grid grid-cols-3 gap-4">
			<Button variant="outline" type="button" onClick={onAppleClick}>
				<AppleIcon />
				<span className="sr-only">{actionText} with Apple</span>
			</Button>
			<Button variant="outline" type="button" onClick={onGoogleClick}>
				<GoogleIcon />
				<span className="sr-only">{actionText} with Google</span>
			</Button>
			<Button variant="outline" type="button" onClick={onMetaClick}>
				<MetaIcon />
				<span className="sr-only">{actionText} with Meta</span>
			</Button>
		</Field>
	)
}
