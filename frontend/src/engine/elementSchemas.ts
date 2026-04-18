import { z } from "zod";

/**
 * Zod schemas mirror backend Pydantic models (see CLAUDE.md §6 and
 * docs/ARCHITECTURE.md §5.2). Any prop change here must also land in
 * `backend/domain/tree.py`, both renderers, a direct-control, and an eval.
 */

export const ELEMENT_TYPES = [
  "Container",
  "Heading",
  "Text",
  "Image",
  "Logo",
  "Background",
  "Button",
  "ImageStrip",
  "Divider",
] as const;

export type ElementType = (typeof ELEMENT_TYPES)[number];

const idSchema = z.string().min(1, "id is required");

const baseFields = {
  id: idSchema,
};

// --- Per-type prop schemas ---

const containerPropsSchema = z
  .object({
    layout: z.enum(["flex-row", "flex-col", "grid"]),
    padding: z.string().optional(),
    gap: z.string().optional(),
    align: z.string().optional(),
    justify: z.string().optional(),
    bg_color: z.string().optional(),
  })
  .strict();

const headingPropsSchema = z
  .object({
    text: z.string(),
    level: z.number().int().min(1).max(6),
    font_family: z.string().optional(),
    font_size: z.number().optional(),
    font_weight: z.number().optional(),
    color: z.string().optional(),
    line_height: z.number().optional(),
    letter_spacing: z.number().optional(),
    align: z.enum(["left", "center", "right"]).optional(),
  })
  .strict();

const textPropsSchema = z
  .object({
    text: z.string(),
    font_family: z.string().optional(),
    font_size: z.number().optional(),
    font_weight: z.number().optional(),
    color: z.string().optional(),
    line_height: z.number().optional(),
    align: z.enum(["left", "center", "right"]).optional(),
  })
  .strict();

const imagePropsSchema = z
  .object({
    src: z.string(),
    alt: z.string(),
    width: z.number().optional(),
    height: z.number().optional(),
    border_radius: z.number().optional(),
    object_fit: z.enum(["cover", "contain", "fill", "none", "scale-down"]).optional(),
    opacity: z.number().min(0).max(1).optional(),
    blur: z.number().min(0).optional(),
  })
  .strict();

const logoPropsSchema = z
  .object({
    src: z.string(),
    alt: z.string(),
    max_height: z.number().optional(),
    max_width: z.number().optional(),
    position: z.enum(["left", "center", "right"]).optional(),
  })
  .strict();

const backgroundPropsSchema = z
  .object({
    bg_type: z.enum(["solid", "gradient", "image", "pattern"]),
    color_1: z.string().optional(),
    color_2: z.string().optional(),
    gradient_direction: z.string().optional(),
    gradient_kind: z.enum(["linear", "radial"]).optional(),
    image_src: z.string().optional(),
    overlay_color: z.string().optional(),
    overlay_opacity: z.number().min(0).max(1).optional(),
    pattern_name: z.enum(["solid", "gradient", "grid", "dots", "noise"]).optional(),
    pattern_color: z.string().optional(),
    pattern_size: z.number().optional(),
  })
  .strict();

const buttonPropsSchema = z
  .object({
    text: z.string(),
    variant: z.enum(["primary", "secondary", "ghost"]),
    color: z.string().optional(),
    text_color: z.string().optional(),
    border_radius: z.number().optional(),
    padding: z.string().optional(),
    href: z.string().optional(),
  })
  .strict();

const dividerPropsSchema = z
  .object({
    orientation: z.enum(["h", "v"]),
    color: z.string().optional(),
    thickness: z.number().optional(),
    length: z.string().optional(),
  })
  .strict();

// --- Discriminated union ---
// ImageStrip is recursive (children are Images) so we type it after Image.

interface BaseElement<T extends ElementType, Props> {
  id: string;
  type: T;
  props: Props;
  children: Element[];
}

export type ContainerElement = BaseElement<"Container", z.infer<typeof containerPropsSchema>>;
export type HeadingElement = BaseElement<"Heading", z.infer<typeof headingPropsSchema>>;
export type TextElement = BaseElement<"Text", z.infer<typeof textPropsSchema>>;
export type ImageElement = BaseElement<"Image", z.infer<typeof imagePropsSchema>>;
export type LogoElement = BaseElement<"Logo", z.infer<typeof logoPropsSchema>>;
export type BackgroundElement = BaseElement<"Background", z.infer<typeof backgroundPropsSchema>>;
export type ButtonElement = BaseElement<"Button", z.infer<typeof buttonPropsSchema>>;
export type ImageStripElement = BaseElement<"ImageStrip", { gap?: string }>;
export type DividerElement = BaseElement<"Divider", z.infer<typeof dividerPropsSchema>>;

export type Element =
  | ContainerElement
  | HeadingElement
  | TextElement
  | ImageElement
  | LogoElement
  | BackgroundElement
  | ButtonElement
  | ImageStripElement
  | DividerElement;

// Lazy recursive schema (zod needs z.lazy for self-referential unions)
export const elementSchema: z.ZodType<Element> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({ ...baseFields, type: z.literal("Container"), props: containerPropsSchema, children: z.array(elementSchema).default([]) }),
    z.object({ ...baseFields, type: z.literal("Heading"), props: headingPropsSchema, children: z.array(elementSchema).default([]) }),
    z.object({ ...baseFields, type: z.literal("Text"), props: textPropsSchema, children: z.array(elementSchema).default([]) }),
    z.object({ ...baseFields, type: z.literal("Image"), props: imagePropsSchema, children: z.array(elementSchema).default([]) }),
    z.object({ ...baseFields, type: z.literal("Logo"), props: logoPropsSchema, children: z.array(elementSchema).default([]) }),
    z.object({ ...baseFields, type: z.literal("Background"), props: backgroundPropsSchema, children: z.array(elementSchema).default([]) }),
    z.object({ ...baseFields, type: z.literal("Button"), props: buttonPropsSchema, children: z.array(elementSchema).default([]) }),
    z.object({ ...baseFields, type: z.literal("ImageStrip"), props: z.object({ gap: z.string().optional() }).strict(), children: z.array(elementSchema).default([]) }),
    z.object({ ...baseFields, type: z.literal("Divider"), props: dividerPropsSchema, children: z.array(elementSchema).default([]) }),
  ]),
);

export const treeSchema = z.object({
  root: elementSchema,
});

export type Tree = z.infer<typeof treeSchema>;
