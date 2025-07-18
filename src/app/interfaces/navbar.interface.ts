export interface NavbarInterface {
    createdBy: string,
    description: string,
    members: { uid: string; role: string, name: string }[];
    name: string,
    channelId: string
}
