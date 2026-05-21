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
  label: string
  confidence: number
  targetBox: AnnotationPixelBox
  labelBox: AnnotationPixelBox | null
}

export const MIN_ANNOTATION_CONFIDENCE = 0.65

const MIN_TARGET_PIXEL_SIZE = 8
const MIN_VISIBLE_MARK_SIZE = 18
const LABEL_WIDTH = 190
const LABEL_HEIGHT = 30
const LABEL_GAP = 12
const EDGE_MARGIN = 8

export function annotationTargetToRenderPlan(
  annotation: AnnotationTarget,
  imageSize: AnnotationImageSize
): AnnotationRenderPlan | null {
  if (!annotation.pageRef.box || annotation.confidence < MIN_ANNOTATION_CONFIDENCE || annotation.rejectionReason) {
    return null
  }

  if (
    !annotation.selfCheck.targetOnStudentWork ||
    !annotation.selfCheck.targetMatchesFeedback ||
    !annotation.selfCheck.labelClearOfTargetMath ||
    !annotation.selfCheck.boxInsidePage
  ) {
    return null
  }

  const rawTargetBox = normalizedBoxToPixelBox(annotation.pageRef.box, imageSize)
  if (!isUsablePixelBox(rawTargetBox)) return null

  const targetBox = ensureVisibleTargetBox(rawTargetBox, imageSize)

  return {
    id: annotation.id,
    shape: annotation.shape,
    label: annotation.label,
    confidence: annotation.confidence,
    targetBox,
    labelBox: annotation.label.trim() ? placeLabelBox(targetBox, imageSize) : null
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

export function placeLabelBox(targetBox: AnnotationPixelBox, imageSize: AnnotationImageSize): AnnotationPixelBox {
  const labelSize = {
    width: Math.min(LABEL_WIDTH, Math.max(96, imageSize.width - EDGE_MARGIN * 2)),
    height: LABEL_HEIGHT
  }

  const placements = ["right", "below", "above", "left"] as const
  for (const placement of placements) {
    const candidate = labelCandidate(placement, targetBox, imageSize, labelSize)
    if (isInsideImage(candidate, imageSize) && !boxesOverlap(candidate, targetBox)) {
      return candidate
    }
  }

  return fitBoxToImage(
    {
      x: targetBox.x,
      y: targetBox.y + targetBox.height + LABEL_GAP,
      ...labelSize
    },
    imageSize,
    labelSize
  )
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

function labelCandidate(
  placement: "right" | "below" | "above" | "left",
  targetBox: AnnotationPixelBox,
  imageSize: AnnotationImageSize,
  labelSize: Pick<AnnotationPixelBox, "width" | "height">
): AnnotationPixelBox {
  if (placement === "below") {
    return {
      x: clamp(targetBox.x, EDGE_MARGIN, Math.max(EDGE_MARGIN, imageSize.width - labelSize.width - EDGE_MARGIN)),
      y: targetBox.y + targetBox.height + LABEL_GAP,
      ...labelSize
    }
  }

  if (placement === "above") {
    return {
      x: clamp(targetBox.x, EDGE_MARGIN, Math.max(EDGE_MARGIN, imageSize.width - labelSize.width - EDGE_MARGIN)),
      y: targetBox.y - labelSize.height - LABEL_GAP,
      ...labelSize
    }
  }

  if (placement === "left") {
    return {
      x: targetBox.x - labelSize.width - LABEL_GAP,
      y: clamp(targetBox.y - 4, EDGE_MARGIN, Math.max(EDGE_MARGIN, imageSize.height - labelSize.height - EDGE_MARGIN)),
      ...labelSize
    }
  }

  return {
    x: targetBox.x + targetBox.width + LABEL_GAP,
    y: clamp(targetBox.y - 4, EDGE_MARGIN, Math.max(EDGE_MARGIN, imageSize.height - labelSize.height - EDGE_MARGIN)),
    ...labelSize
  }
}

function fitBoxToImage(
  box: AnnotationPixelBox,
  imageSize: AnnotationImageSize,
  fallbackSize: Pick<AnnotationPixelBox, "width" | "height">
): AnnotationPixelBox {
  const width = Math.min(Math.max(box.width, fallbackSize.width), imageSize.width - EDGE_MARGIN * 2)
  const height = Math.min(Math.max(box.height, fallbackSize.height), imageSize.height - EDGE_MARGIN * 2)

  return {
    x: clamp(box.x, EDGE_MARGIN, Math.max(EDGE_MARGIN, imageSize.width - width - EDGE_MARGIN)),
    y: clamp(box.y, EDGE_MARGIN, Math.max(EDGE_MARGIN, imageSize.height - height - EDGE_MARGIN)),
    width,
    height
  }
}

function isInsideImage(box: AnnotationPixelBox, imageSize: AnnotationImageSize) {
  return box.x >= 0 && box.y >= 0 && box.x + box.width <= imageSize.width && box.y + box.height <= imageSize.height
}

function boxesOverlap(left: AnnotationPixelBox, right: AnnotationPixelBox) {
  return left.x < right.x + right.width && left.x + left.width > right.x && left.y < right.y + right.height && left.y + left.height > right.y
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0
  return clamp(value, 0, 1)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
