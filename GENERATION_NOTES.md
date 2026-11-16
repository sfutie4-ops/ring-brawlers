# Artwork generation and packing

The built-in image generator created one 24-pose caricature atlas per emcee, using that emcee's official FlipTop portrait as the identity reference. The requested style was a recognizable editorial caricature: large expressive head, compact adult body, clean ink outlines, smooth cel shading, and transparent background. Higgsfield and Remotion were not used.

Shared pose prompt: six columns by four rows, facing right, consistent clothes and proportions; row one two guard poses and four walk phases; row two six straight-punch phases; row three six side-kick phases; row four six uppercut phases. Every head, hand, and shoe should remain inside its own cell with transparent margins. The portraits and descriptive feature cues were specific to each named emcee. The generated sheets are stylized illustrations, not photographs.

Effects prompt: six columns by four rows of isolated cel-shaded gold impact bursts, cyan slash arcs, violet energy projectiles, and pale gold dust clouds, with transparent backgrounds, smooth contours, and frame padding.

The source PNG cells were packed into 320 × 320 cells with 32-pixel gutters. Low-alpha background noise was cleared while retaining antialiased silhouette edges. RGB values in fully transparent pixels were zeroed. Frame metadata preserves the horizontal center axis and each frame's foot anchor. A sampled silhouette contour is supplied separately from a conservative convex-hull mesh with triangle indices. The renderer uses the PNG alpha; these meshes support inspection/export and do not secretly change attack reach.

The game animates the resulting key poses using distinct anticipation/strike/recovery timing, fixed-step simulation, interpolation of position, and small eased transforms. It does not claim generated optical-flow in-betweens or mesh-based skeletal deformation.
