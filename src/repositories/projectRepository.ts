import { prisma } from "@/lib/prisma";

const ownerSelect = {
id: true,
name: true,
email: true,
};

export const projectRepository = {
findAll() {
return prisma.project.findMany({
orderBy: {
createdAt: "desc",
},
include: {
owner: {
select: ownerSelect,
},
},
});
},

findById(id: string) {
return prisma.project.findUnique({
where: {
id,
},
include: {
owner: {
select: ownerSelect,
},
},
});
},

findByIdForOwner(id: string, ownerId: string) {
return prisma.project.findFirst({
where: {
id,
ownerId,
},
});
},

create(data: {
name: string;
description?: string;
ownerId: string;
}) {
return prisma.project.create({
data: {
name: data.name,
description: data.description,
owner: {
connect: {
id: data.ownerId,
},
},
},
include: {
owner: {
select: ownerSelect,
},
},
});
},
};
