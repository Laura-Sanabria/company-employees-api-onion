export interface CityPolicy {
    canDelete: boolean;
    canUpdate: boolean;
    canCreate: boolean;
    canPatch: boolean;
}

export const cityPolicies: Record<string, CityPolicy> = {
    medellin: {
        canDelete: true,
        canUpdate: true,
        canCreate: true,
        canPatch: false, // Medellín NO puede hacer PATCH
    },
    bogota: {
        canDelete: false, // Bogotá NO puede eliminar
        canUpdate: true,
        canCreate: true,
        canPatch: true, // Bogotá puede hacer PATCH
    },
};

export function getCityPolicy(city: string): CityPolicy {
    const policy = cityPolicies[city];
    if (!policy) {
        throw new Error(`No hay políticas definidas para la ciudad ${city}`);
    }
    return policy;
}