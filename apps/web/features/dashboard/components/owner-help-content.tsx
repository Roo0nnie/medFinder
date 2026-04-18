"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/core/components/ui/accordion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card"

const OWNER_FAQS = [
	{
		id: "pharmacies",
		q: "How do I add or update my pharmacies?",
		a: 'Open "My Pharmacies" to create a location or edit details. Keep addresses and hours accurate so customers find you in search and on the map.',
	},
	{
		id: "catalog",
		q: "How does product management work?",
		a: "Use Product Management to maintain brands, categories, and inventory. Products you stock can appear in customer search when availability and details are set.",
	},
	{
		id: "staff",
		q: "How do I manage staff?",
		a: 'Go to "Staff Management" to invite or update team members. Staff can help maintain inventory and day-to-day updates within the access you give them.',
	},
	{
		id: "deletionRequests",
		q: "What are deletion requests?",
		a: "When a removal needs review, it appears under Deletion Requests. Open an item to see context and complete or decline it according to your process.",
	},
	{
		id: "reviewsAnalytics",
		q: "Where do I see reviews and analytics?",
		a: "Reviews lists feedback on your pharmacies. Analytics shows how customers engage with your products and searches over time.",
	},
	{
		id: "profilePassword",
		q: "How do I update my profile or password?",
		a: "Open Account → Profile to edit your name, phone, and photo. Use Change password there with your current password to set a new one.",
	},
] as const

export function OwnerHelpContent() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>FAQ</CardTitle>
				<CardDescription>Common questions with quick answers.</CardDescription>
			</CardHeader>
			<CardContent>
				<Accordion className="w-full" defaultValue={[OWNER_FAQS[0].id]} multiple>
					{OWNER_FAQS.map(item => (
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
	)
}
