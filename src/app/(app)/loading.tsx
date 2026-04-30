import { Sun } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Sun className="h-10 w-10 text-solar fill-solar/20 animate-spin" />
    </div>
  )
}
