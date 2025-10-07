declare const nappyhoodServices: ({
    name: string;
    category: "HAIR_TREATMENTS";
    description: string;
    singlePrice: number;
    combinedPrice: null;
    childPrice: number;
    childCombinedPrice: null;
} | {
    name: string;
    category: "HAIR_TREATMENTS";
    description: string;
    singlePrice: number;
    combinedPrice: number;
    childPrice: number;
    childCombinedPrice: number;
} | {
    name: string;
    category: "HAIR_TREATMENTS";
    description: string;
    singlePrice: number;
    combinedPrice: number;
    childPrice: null;
    childCombinedPrice: null;
} | {
    name: string;
    category: "HAIR_TREATMENTS";
    description: string;
    singlePrice: number;
    combinedPrice: null;
    childPrice: null;
    childCombinedPrice: null;
} | {
    name: string;
    category: "TWIST_HAIRSTYLE";
    description: string;
    singlePrice: number;
    combinedPrice: number;
    childPrice: number;
    childCombinedPrice: number;
} | {
    name: string;
    category: "TWIST_HAIRSTYLE";
    description: string;
    singlePrice: number;
    combinedPrice: number;
    childPrice: null;
    childCombinedPrice: null;
} | {
    name: string;
    category: "CORNROWS_BRAIDS";
    description: string;
    singlePrice: number;
    combinedPrice: number;
    childPrice: null;
    childCombinedPrice: null;
} | {
    name: string;
    category: "STRAWSET_CURLS";
    description: string;
    singlePrice: number;
    combinedPrice: number;
    childPrice: null;
    childCombinedPrice: null;
} | {
    name: string;
    category: "STYLING_SERVICE";
    description: string;
    singlePrice: number;
    combinedPrice: number;
    childPrice: null;
    childCombinedPrice: null;
} | {
    name: string;
    category: "STYLING_SERVICE";
    description: string;
    singlePrice: number;
    combinedPrice: null;
    childPrice: null;
    childCombinedPrice: null;
} | {
    name: string;
    category: "SPECIAL_OFFERS";
    description: string;
    singlePrice: number;
    combinedPrice: null;
    childPrice: null;
    childCombinedPrice: null;
})[];
declare function seedServices(): Promise<void>;
export { seedServices, nappyhoodServices };
//# sourceMappingURL=seedServices.d.ts.map