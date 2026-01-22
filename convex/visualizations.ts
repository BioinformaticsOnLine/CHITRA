
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 1. Generate Upload URL
export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});

// 2. Save Visualization
export const saveVisualization = mutation({
    args: {
        title: v.string(),
        isPublic: v.boolean(),
        dataSetType: v.union(v.literal("example"), v.literal("custom_db"), v.literal("shared")),
        exampleDataSetPath: v.optional(v.string()),
        datasetId: v.optional(v.string()),

        // File Storage IDs
        files: v.optional(v.object({
            synteny: v.optional(v.string()),
            species: v.optional(v.string()),
            reference: v.optional(v.string()),
        })),

        // Visualization State
        visualizationState: v.object({
            version: v.string(),
            selectedSpecies: v.array(v.string()),
            selectedChromosomes: v.array(v.string()),
            selectedSyntenyIds: v.optional(v.array(v.string())),
            alignmentFilter: v.union(v.literal('all'), v.literal('forward'), v.literal('reverse')),
            selectedMutationTypes: v.array(v.array(v.any())),
            customSpeciesColors: v.array(v.array(v.string())),

            mainViewTransform: v.object({ k: v.number(), x: v.number(), y: v.number() }),
            showAnnotations: v.boolean(),
            showTooltips: v.boolean(),
            isDetailViewOpen: v.optional(v.boolean()),
            currentSelectedBlockIndex: v.optional(v.number()),
            chordViewConfig: v.optional(v.any()),
        }),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated call to saveVisualization");
        }

        const { files, ...metadata } = args;

        const id = await ctx.db.insert("visualizations", {
            ...metadata,
            files,
            userId: identity.subject, // Clerk User ID
            createdAt: Date.now(),
        });

        return id;
    },
});

// 3. Get Visualization
export const getVisualization = query({
    args: { id: v.id("visualizations") },
    handler: async (ctx, args) => {
        const viz = await ctx.db.get(args.id);
        if (!viz) {
            throw new Error("Visualization not found");
        }

        // Check access
        const identity = await ctx.auth.getUserIdentity();
        const isOwner = identity && identity.subject === viz.userId;
        if (!viz.isPublic && !isOwner) {
            throw new Error("Unauthorized access to this visualization");
        }

        // Generate URLs for files if they exist
        let fileUrls: { synteny?: string | null; species?: string | null; reference?: string | null } = {};
        if (viz.files) {
            // Resolve storage IDs to URLs
            const syntenyUrl = viz.files.synteny ? await ctx.storage.getUrl(viz.files.synteny) : null;
            const speciesUrl = viz.files.species ? await ctx.storage.getUrl(viz.files.species) : null;
            const referenceUrl = viz.files.reference ? await ctx.storage.getUrl(viz.files.reference) : null;

            fileUrls = {
                synteny: syntenyUrl,
                species: speciesUrl,
                reference: referenceUrl
            };
        }

        return {
            ...viz,
            fileUrls
        };
    },
});

// 4. List User's Visualizations
export const listMyVisualizations = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const visualizations = await ctx.db
            .query("visualizations")
            .withIndex("by_user", (q) => q.eq("userId", identity.subject))
            .order("desc")
            .collect();

        return visualizations.map(viz => ({
            id: viz._id,
            title: viz.title,
            isPublic: viz.isPublic,
            createdAt: viz.createdAt, // or viz._creationTime
            creationTime: viz._creationTime
        }));
    },
});

// 5. Toggle Visibility
export const toggleVisibility = mutation({
    args: { id: v.id("visualizations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated");
        }

        const viz = await ctx.db.get(args.id);
        if (!viz) throw new Error("Not found");
        if (viz.userId !== identity.subject) throw new Error("Unauthorized");

        await ctx.db.patch(args.id, { isPublic: !viz.isPublic });
    },
});

// 6. Delete Visualization
export const deleteVisualization = mutation({
    args: { id: v.id("visualizations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated");
        }

        const viz = await ctx.db.get(args.id);
        if (!viz) throw new Error("Not found");
        if (viz.userId !== identity.subject) throw new Error("Unauthorized");

        // Optionally delete files from storage if we are tracking them
        // For now, we just delete the document record
        await ctx.db.delete(args.id);
    },
});
