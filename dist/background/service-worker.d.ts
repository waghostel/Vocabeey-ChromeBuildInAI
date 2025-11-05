/**
 * Service Worker for Language Learning Chrome Extension
 * Handles extension lifecycle and coordinates between components
 */
/**
 * Handle language detection request
 * Routes detection to offscreen document where Chrome AI APIs are available
 *
 * Exported as handleDetectLanguageInternal for direct calls from service worker context
 */
export declare function handleDetectLanguageInternal(payload: {
    text: string;
}): Promise<{
    language: string;
    confidence: number;
}>;
//# sourceMappingURL=service-worker.d.ts.map