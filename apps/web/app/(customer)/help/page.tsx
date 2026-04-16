import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/core/components/ui/accordion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card"
import { buttonVariants } from "@/core/components/ui/button-variants"
import { cn } from "@/core/lib/utils"

const FAQS = [
	{
		id: "findProduct",
		q: "How do I find a product?",
		a: "Use the search on the home page, then filter by pharmacy, availability, and product variants.",
	},
	{
		id: "accountInfo",
		q: "How do I update my profile information?",
		a: "Go to Profile and edit your details. Changes save immediately after you click “Save changes”.",
	},
	{
		id: "passwordChange",
		q: "How do I change my password?",
		a: "Go to Profile → Change password. You’ll need your current password to set a new one.",
	},
	{
		id: "theme",
		q: "How do I switch between light and dark mode?",
		a: "Use the sun/moon toggle in the top navigation bar. Your preference will persist for this browser.",
	},
] as const

export default function HelpPage() {
	const supportEmail = "support@medfinder.com"
	const subject = encodeURIComponent("MedFinder support")
	const body = encodeURIComponent(
		["Hi MedFinder Support,", "", "I need help with:", "", "Account email:", "Details:"].join("\n")
	)
	const mailto = `mailto:${supportEmail}?subject=${subject}&body=${body}`

	return (
		<div className="flex w-full flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold tracking-tight">Help</h1>
				<p className="text-muted-foreground text-sm">Quick answers, support options, and tips right when you need them.</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>FAQ</CardTitle>
					<CardDescription>Common questions with quick answers.</CardDescription>
				</CardHeader>
				<CardContent>
					<Accordion className="w-full" defaultValue={[FAQS[0].id]} multiple>
						{FAQS.map(item => (
							<AccordionItem key={item.id} value={item.id}>
								<AccordionTrigger>{item.q}</AccordionTrigger>
								<AccordionContent>
									<p className="text-muted-foreground">{item.a}</p>
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				</CardContent>
			</Card>
		</div>
	)
}

