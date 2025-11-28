import { Theme } from "@aws-amplify/ui-react";
import { Variants } from "framer-motion";

export const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
            delayChildren: 0.1
        }
    }
};

export const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 100 }
    }
};

export const themes: Theme = {
        name: 'kyc-liveness-theme',
        tokens: {
            colors: {
                background: {
                    primary: { value: 'var(--background)' },
                    secondary: { value: 'var(--input-bg)' },
                },
                font: {
                    primary: { value: 'var(--foreground)' },
                    secondary: { value: 'var(--muted)' },
                },
                brand: {
                    primary: {
                        10: { value: 'var(--secondary)' },
                        80: { value: 'var(--primary)' },
                        90: { value: 'var(--primary-hover)' },
                        100: { value: 'var(--primary-hover)' },
                    },
                },
            },
            fonts: {
                default: {
                    variable: { value: 'var(--font-geist-sans)' },
                    static: { value: 'var(--font-geist-sans)' },
                },
            },
            radii: {
                small: { value: 'var(--radius-sm)' },
                medium: { value: 'var(--radius-md)' },
                large: { value: 'var(--radius-lg)' },
                xl: { value: 'var(--radius-lg)' },
            },
        },
    };
