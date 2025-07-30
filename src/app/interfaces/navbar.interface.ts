export interface NavbarInterface {
    createdBy: string,
    description: string,
    members: { id: string; role: string, name: string, imgUrl: string }[];
    name: string,
    channelId: string
}
