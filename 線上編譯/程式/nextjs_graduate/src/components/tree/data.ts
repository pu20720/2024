const fileData = [
   {
      id: "fcf82497-74f4-46dd-bd2e-e9a3ad390715",
      name: "user_01",
      fileType: 'folder',
      children: [
         {
            id: "fcf82497-74f4-46dd-bd2e-e9a3ad390716",
            name: "Teacher",
            fileType: 'folder',
            children: [
               {
                  id: "fcf82497-74f4-46dd-bd2e-e9a3ad390717",
                  name: "Teacher_01",
                  fileType: 'folder',
                  children: [
                     {
                        id: "fcf82497-74f4-46dd-bd2e-e9a3ad390718",
                        name: "Teacher_John.js",
                        fileType: 'js',
                     }
                  ]
               },
               {
                  id: "fcf82497-74f4-46dd-bd2e-e9a3ad890718",
                  name: "Teacher_02",
                  fileType: 'document',
               }
            ]
         },
         {
            id: "fcf82497-74f4-46dd-bd2e-e9a3ad390719",
            name: "Student",
            fileType: 'folder',
            children: [
               {
                  id: "fcf82497-74f4-46dd-bd2e-e9a3ad390720",
                  name: "Student_01.py",
                  fileType: 'py',
               },
               {
                  id: "fcf82497-74f4-46dd-bd2e-e9a3ad390721",
                  name: "Student_02",
                  fileType: 'document',
               }
            ]
         },
         {
            id: "fcf82497-74f4-46dd-bd2e-e9a3ad390722",
            name: "Parent",
            fileType: 'folder',
         }
      ]
   }
]

export function fetchFileData() {
   return new Promise((resolve) => {
      setTimeout(() => {
         resolve(fileData);
      }, 1000);
   });
}
