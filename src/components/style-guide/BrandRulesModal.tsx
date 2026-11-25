"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StyleGuideProfile } from "@/lib/schemas/styleGuide.schema";

interface BrandRulesModalProps {
  profile: StyleGuideProfile | null;
}

export function BrandRulesModal({ profile }: BrandRulesModalProps) {
  if (!profile) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{profile.brandName} — Extracted Rules</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">
            Primary Colors
          </p>
          <div className="flex flex-wrap gap-2">
            {profile.visualIdentity.primaryHexColors.map((hex) => (
              <Badge key={hex} variant="outline">
                {hex}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
            Tone of Voice
          </p>
          <p className="text-muted-foreground">
            {profile.toneOfVoice.adjectives.join(", ") || "Not specified"} (
            {profile.toneOfVoice.readingLevelTarget})
          </p>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
            Forbidden Words
          </p>
          <p className="text-muted-foreground">
            {profile.toneOfVoice.forbiddenWords.length > 0
              ? profile.toneOfVoice.forbiddenWords.join(", ")
              : "None"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
