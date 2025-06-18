import { Progress } from "@/components/ui/progress"
import { ExperienceBudget } from "@/models/utility/experienceBudget/ExperienceBudget";
import { THREAT_TYPE, Threat } from "@/models/utility/threat/Threat.class"
import { useEffect, useRef, useState } from "react"

interface ThreadTrackerProps {
    budget?: ExperienceBudget; // 0-220 (normalized to 0-100)
    partySize?: number;
}
const ADDITIONAL_IMPOSSIBLE_UNITS = 3;
const ADDITIONAL_TRIVIAL_UNITS = 1;

function getMergedThresholds(threatEntries: [number, string][]) {
    const colors = [
        "bg-green-400",   // Trivial/Low
        "bg-lime-400",    // Moderate
        "bg-yellow-400",  // Moderate+
        "bg-orange-400",  // Severe
        "bg-red-400",     // Extreme
        "bg-gray-700"     // Impossible
    ];

    type Group = { keys: number[], baseLabel: string, color?: string };
    const groups: Group[] = [];

    threatEntries.forEach(([key, label]) => {
        const base = label.replace(/(\+|-)+$/g, '').trim();
        let group = groups.find(g => g.baseLabel === base);
        if (!group) {
            group = { keys: [], baseLabel: base };
            groups.push(group);
        }
        group.keys.push(key);
    });
    
    // duplicate group.keys on the last and first group to make it larger
    if (groups.length > 0) {
        const lastGroup = groups[groups.length - 1];
        lastGroup.keys.push(...Array.from({ length: ADDITIONAL_IMPOSSIBLE_UNITS }, () => lastGroup.keys[lastGroup.keys.length - 1]).flat());
        const firstGroup = groups[0];
        firstGroup.keys.unshift(...Array.from({ length: ADDITIONAL_TRIVIAL_UNITS }, () => firstGroup.keys[0]).flat());
    }

    // Each group's "size" is the number of keys it has
    const units = groups.map(g => g.keys.length);
    const totalUnits = units.reduce((a, b) => a + b, 0);
    const percentages = units.map(u => (u / totalUnits) * 100);

    let acc = 0;
    const merged = groups.map((group, i) => {
        const min = acc;
        const width = percentages[i];
        let max = min + width;
        if (i === groups.length - 1) max = 100;
        acc = max;
        return {
            ...group,
            min,
            max,
            width: max - min,
            color: colors[i % colors.length],
        };
    });

    return merged;
}

export function ThreadTracker({ budget = ExperienceBudget.Moderate, partySize = 4 }: ThreadTrackerProps) {
    const threatEntries = Object.entries(THREAT_TYPE).map(([key, label]) => [parseInt(key), label]) as [number, string][];
    const merged = getMergedThresholds(threatEntries);

    // Normalize value from 0-240 to 0-100
    const normalizedValue = Math.max(0, Math.min(100, (budget.valueOf() ?? 0) / ((12 + ADDITIONAL_IMPOSSIBLE_UNITS+ADDITIONAL_TRIVIAL_UNITS)*20) * 100));

    // Responsive: detect small width
    const containerRef = useRef<HTMLDivElement>(null);
    const [isSmall, setIsSmall] = useState(false);

    useEffect(() => {
        function handleResize() {
            if (containerRef.current) {
                setIsSmall(containerRef.current.offsetWidth < 800);
            }
        }
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Use Threat.fromExperienceBudget to get the achieved threat
    const achievedThreat = Threat.fromExperienceBudget(budget, partySize);

    // Find the merged threshold index where Threat.threat matches any key in the group
    const currentThresholdIdx = merged.findIndex(group =>
        group.keys.includes(Number(achievedThreat.threat))
    );

    // For small screens, show only 3 closest thresholds (current, one before, one after)
    const distance = isSmall ? 1 : 2;
    const start = Math.max(0, currentThresholdIdx - distance);
    const end = Math.min(merged.length - 1, currentThresholdIdx + distance);

    let visibleThresholds = merged.slice(start, end + 1);

    // If the last visible threshold is the last group and NOT the current, trim it to a single segment
    const lastIdx = merged.length - 1;
    const lastVisibleIdx = visibleThresholds.length - 1;
    const lastVisibleIsLast = merged.indexOf(visibleThresholds[lastVisibleIdx]) === lastIdx;
    const lastIsCurrent = currentThresholdIdx === lastIdx;

    // We'll trim the last threshold to a small segment (e.g., 10% of visible range)
    const TRIMMED_SEGMENT_PCT = isSmall ? 75 : 15;

    let visibleMin = visibleThresholds[0].min;
    let visibleMax = visibleThresholds[visibleThresholds.length - 1].max;

    // If last visible is last threshold and not current, trim its width
    if (lastVisibleIsLast && !lastIsCurrent) {
        // Set the max to be only a small segment after the previous threshold
        const prev = visibleThresholds[lastVisibleIdx - 1];
        visibleMax = prev.max + ((visibleThresholds[lastVisibleIdx].max - prev.max) * (TRIMMED_SEGMENT_PCT / 100));
        // Adjust the last threshold's max for rendering
        visibleThresholds = [
            ...visibleThresholds.slice(0, -1),
            {
                ...visibleThresholds[lastVisibleIdx],
                min: prev.max,
                max: visibleMax,
                width: visibleMax - prev.max,
            }
        ];
    }

    // Rescale value to fit the visible range
    const scaledValue = ((normalizedValue - visibleMin) / (visibleMax - visibleMin)) * 100;

    return (
        <div ref={containerRef} className="relative h-8 w-full overflow-visible">
            {/* Main progress bar */}
            <Progress
                value={scaledValue}
                className="h-3"
            />
            {/* Colored overlays for thresholds with visible borders */}
            <div className="absolute inset-0 flex h-3 w-full pointer-events-none">
                {visibleThresholds.map((t, i) => {
                    // Always recalculate left/width as percent of visible range
                    const left = ((t.min - visibleMin) / (visibleMax - visibleMin)) * 100;
                    const width = ((t.max - t.min) / (visibleMax - visibleMin)) * 100;
                    return (
                        <div
                            key={i}
                            className={`${t.color} mix-blend-multiply h-full absolute border-r border`}
                            style={{
                                left: `${left}%`,
                                width: `${width}%`,
                                opacity: 0.4,
                                zIndex: 2,
                                borderRight: i === visibleThresholds.length - 1 ? "none" : undefined,
                            }}
                        />
                    );
                })}
            </div>
            {/* Labels aligned to the start of their thresholds */}
            <div className="absolute top-full left-0 w-full h-5 pointer-events-none">
                {visibleThresholds.map((t, i) => {
                    const left = ((t.min - visibleMin) / (visibleMax - visibleMin)) * 100;
                    const width = ((t.max - t.min) / (visibleMax - visibleMin)) * 100;
                    // Find which threshold is current in the visible set
                    const isCurrent =
                        merged.indexOf(t) === currentThresholdIdx;
                    const label = isCurrent ? achievedThreat.toLabel() : t.baseLabel;
                    return (
                        <span
                            key={i}
                            className={
                                "absolute px-1 truncate " +
                                (isCurrent
                                    ? "font-bold drop-shadow-sm"
                                    : "text-gray-700")
                            }
                            style={{
                                left: `${left}%`,
                                width: `${width}%`,
                                minWidth: 0,
                                textAlign: "left",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                transform: "translateX(0%)",
                            }}
                        >
                            {label}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}