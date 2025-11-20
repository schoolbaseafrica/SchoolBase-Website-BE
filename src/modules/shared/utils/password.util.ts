export function generate_temp_password() {
    return Math.random().toString(36).slice(-10);
    }