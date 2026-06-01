import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/',
    component: ComponentCreator('/', 'f65'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', '13c'),
    routes: [
      {
        path: '/architecture',
        component: ComponentCreator('/architecture', 'c53'),
        exact: true,
        sidebar: "docs"
      },
      {
        path: '/intro',
        component: ComponentCreator('/intro', 'f92'),
        exact: true,
        sidebar: "docs"
      },
      {
        path: '/protocol',
        component: ComponentCreator('/protocol', 'b07'),
        exact: true,
        sidebar: "docs"
      },
      {
        path: '/roadmap',
        component: ComponentCreator('/roadmap', 'cf3'),
        exact: true,
        sidebar: "docs"
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
