export const formatNumberSpace = (val: string | number): string => {
    if (!val) return '';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};
