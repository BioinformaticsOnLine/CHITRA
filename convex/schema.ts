
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    visualizations: defineTable({
        userId: v.string(), // Clerk user ID
        title: v.string(),
        description: v.optional(v.string()),
        isPublic: v.boolean(),

        // Dataset files are stored in Convex File Storage
        // We store the storageId (ID of the file) here
        datasetId: v.optional(v.string()), // A logic grouping ID (for custom types) or 'example'
        dataSetType: v.union(v.literal("example"), v.literal("custom_db"), v.literal("shared")),
        exampleDataSetPath: v.optional(v.string()),

        // File Storage IDs (Replacing file paths)
        files: v.optional(v.object({
            synteny: v.optional(v.string()), // storageId
            genome: v.optional(v.string()), // storageId
            reference: v.optional(v.string()), // storageId
        })),

        // Visualization State (JSON blob in Supabase, structured here)
        // We can use v.any() for complex nested state if we don't want to strictly schema it yet,
        // or strictly define it. For flexibility during migration, let's use a structured object 
        // but keep some fields flexible or `any` where deep nesting occurs (like D3 objects converted to JSON).
        visualizationState: v.object({
            version: v.string(),
            selectedGenomes: v.optional(v.array(v.string())),
            selectedSpecies: v.optional(v.array(v.string())), // Legacy support
            selectedChromosomes: v.array(v.string()),
            selectedSyntenyIds: v.optional(v.array(v.string())),
            alignmentFilter: v.union(v.literal('all'), v.literal('forward'), v.literal('reverse')),
            // Storing maps as arrays of entries
            selectedMutationTypes: v.array(v.array(v.any())),
            customGenomeColors: v.optional(v.array(v.array(v.string()))),
            customSpeciesColors: v.optional(v.array(v.array(v.string()))), // Legacy support
            selectedSynteny: v.optional(v.array(v.any())),

            mainViewTransform: v.object({ k: v.number(), x: v.number(), y: v.number() }),
            showAnnotations: v.boolean(),
            showTooltips: v.boolean(),
            isDetailViewOpen: v.optional(v.boolean()),
            currentSelectedBlockIndex: v.optional(v.number()),
            chordViewConfig: v.optional(v.any()),
        }),

        createdAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_public", ["isPublic"])
});
