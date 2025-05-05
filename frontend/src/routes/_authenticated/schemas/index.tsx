import { createFileRoute } from '@tanstack/react-router'
import Schemas from '@/features/schemas'

export const Route = createFileRoute('/_authenticated/schemas/')({
  component: Schemas,
})
