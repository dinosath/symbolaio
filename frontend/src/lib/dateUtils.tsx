import { formatDistanceToNow, parseISO } from 'date-fns';
import { JSX } from 'react';

/**
 * Renders a date as relative time (e.g., "4 hours ago") with a tooltip showing the full date.
 * @param date - The date to render. Can be a string (ISO format) or a Date object.
 * @returns A JSX element with the relative time and a tooltip for the full date.
 */
export const renderDateWithTooltip = (date: string | Date | undefined | null): JSX.Element | string => {
    if (!date) return "N/A";

    let parsedDate: Date;
    try {
        if (typeof date === "string") {
            parsedDate = parseISO(date); // Parse ISO string
        } else if (date instanceof Date) {
            parsedDate = date; // Already a Date object
        } else {
            return "Invalid Date";
        }

        const relativeTime = formatDistanceToNow(parsedDate, { addSuffix: true }); // e.g., "4 hours ago"

        return (
            <span title={parsedDate.toLocaleString('en-US', { timeZoneName: 'short' })}>
                {relativeTime}
            </span>
        );
    } catch (error) {
        console.error("Error parsing date:", error);
        return "Invalid Date";
    }
};