import { mutation, query } from "./_generated/server"
import { ensureTeacher, requireTeacher } from "./auth"

export const current = query({
  args: {},
  handler: async (ctx) => {
    return await requireTeacher(ctx)
  }
})

export const syncCurrent = mutation({
  args: {},
  handler: async (ctx) => {
    return await ensureTeacher(ctx)
  }
})
