import type { AnnotationTarget, NormalizedBox } from "@/lib/ai-schemas"

export type AnnotationImageSize = {
  width: number
  height: number
}

export type AnnotationPixelBox = {
  x: number
  y: number
  width: number
  height: number
}

export type AnnotationRenderPlan = {
  id: string
  shape: AnnotationTarget["shape"]
  targetBox: AnnotationPixelBox
}

const MIN_TARGET_PIXEL_SIZE = 8
const MIN_VISIBLE_MARK_SIZE = 18

export function annotationTargetToRenderPlan(
  annotation: AnnotationTarget,
  imageSize: AnnotationImageSize
): AnnotationRenderPlan | null {
  if (!annotation.pageRef.box || annotation.rejectionReason) {
    return null
  }

  const rawTargetBox = normalizedBoxToPixelBox(annotation.pageRef.box, imageSize)
  if (!isUsablePixelBox(rawTargetBox)) return null

  const targetBox = ensureVisibleTargetBox(rawTargetBox, imageSize)

  return {
    id: annotation.id,
    shape: annotation.shape,
    targetBox
  }
}

export function normalizedBoxToPixelBox(box: NormalizedBox, imageSize: AnnotationImageSize): AnnotationPixelBox {
  const x = clamp01(box.x) * imageSize.width
  const y = clamp01(box.y) * imageSize.height
  const right = Math.min(imageSize.width, x + clamp01(box.width) * imageSize.width)
  const bottom = Math.min(imageSize.height, y + clamp01(box.height) * imageSize.height)

  return {
    x,
    y,
    width: Math.max(0, right - x),
    height: Math.max(0, bottom - y)
  }
}

function ensureVisibleTargetBox(box: AnnotationPixelBox, imageSize: AnnotationImageSize): AnnotationPixelBox {
  const width = Math.min(Math.max(box.width, MIN_VISIBLE_MARK_SIZE), imageSize.width)
  const height = Math.min(Math.max(box.height, MIN_VISIBLE_MARK_SIZE), imageSize.height)

  return {
    x: clamp(box.x, 0, Math.max(0, imageSize.width - width)),
    y: clamp(box.y, 0, Math.max(0, imageSize.height - height)),
    width,
    height
  }
}

function isUsablePixelBox(box: AnnotationPixelBox) {
  return box.width >= MIN_TARGET_PIXEL_SIZE && box.height >= MIN_TARGET_PIXEL_SIZE
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0
  return clamp(value, 0, 1)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
