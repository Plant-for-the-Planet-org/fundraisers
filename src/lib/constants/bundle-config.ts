import type { BundleConfig } from '@/lib/types/bundle';

export const BUNDLE_CONFIG: BundleConfig = {
  meta: {
    version: '1.0.0',
    workspace: 'DE',
    defaultTab: 'staff-picks',
    tagline: 'Choose your feeling.',
    subline: "The forests don't care why you give. But you will.",
  },
  supportProjects: {
    DE: 'proj_bFH0BU0Qw02RuetpQlLOMVYX',
  },
  tabs: [
    {
      id: 'staff-picks',
      label: 'Staff Picks',
      description: 'Chosen by the Plant-for-the-Planet team.',
      bundleSlugs: [
        'underdog-bundle',
        'undo-your-amazon-order',
        'supply-chain-guilt-trip',
        'ancestral-lands',
      ],
    },
    {
      id: 'wonder',
      label: 'Wonder',
      description: 'The world is vast and beautiful.',
      bundleSlugs: ['amazon-route', 'roof-of-the-world'],
    },
    {
      id: 'rage',
      label: 'Rage',
      description: 'This is broken and needs fixing.',
      bundleSlugs: [
        'undo-your-amazon-order',
        'supply-chain-guilt-trip',
        'worst-of-the-worst',
        'fix-what-we-broke',
      ],
    },
    {
      id: 'love',
      label: 'Love',
      description: 'For people, places, things I care about.',
      bundleSlugs: [
        'underdog-bundle',
        'ancestral-lands',
        'where-your-coffee-grows',
        'for-your-children',
      ],
    },
    {
      id: 'custom',
      label: 'Custom',
      description: 'Build your own bundle — pick projects one by one.',
      bundleSlugs: [],
    },
  ],
  bundles: [
    {
      slug: 'ancestral-lands',
      label: 'Ancestral Lands',
      tabs: ['staff-picks', 'love'],
      tagline: 'Rooted in Community. Led by the people that never left.',
      projectIds: [
        'proj_mRCTIYNVjd2vF4tYLjqH9UUr',
        'proj_26OP7JiC5mapekmJ4OahxzD8',
        'proj_M7PPbBvQKNxOI4wJcf5BZmjY',
        'proj_fVvnwD74dAwkWs7wuyj0XmzG',
      ],
    },
    {
      slug: 'fix-what-we-broke',
      label: 'Fix What We Broke',
      tabs: ['rage'],
      tagline: 'Not guilt. Just responsibility. Just a shovel.',
      projectIds: [
        'proj_tl6PgJPAO4fdzK3i1focPhvo',
        'proj_oJfz884YzcsmggrlNGw3E0N8',
        'proj_No23wiy8Snz4g5OeT6Fy95pv',
        'proj_vwXy0Ql7P0Gb5nTGjTYaZQJ2',
      ],
    },
    {
      slug: 'for-your-children',
      label: 'For My kids',
      tabs: ['love'],
      tagline: 'A forest that will still be growing strong when they are.',
      projectIds: [
        'proj_9gMJZ5oDr6HG6TvExAlJpQsJ',
        'proj_APxvAapPEARZBTWB3fBMYCtl',
        'proj_Sg6hjdf9X9lXmITqfE6pAZFs',
        'proj_5h5KaMTA92ZnzUP4wgei4bpJ',
      ],
    },
    {
      slug: 'roof-of-the-world',
      label: 'Roof of the World',
      tabs: ['wonder'],
      tagline: 'High up where the air is thin and the stakes are high.',
      projectIds: [
        'proj_TeYMDlOdOfUzL2uxJy4IeZZ6',
        'proj_MaUEbMr9npIY4J4L4NPXetPZ',
        'proj_EmOozMhGrxgQBRN5uC8Y0MO9',
        'proj_MdWyzUGdKjMlRnFH6lmLBYE3',
      ],
    },
    {
      slug: 'supply-chain-guilt-trip',
      label: 'Supply Chain Guilt Trip',
      tabs: ['staff-picks', 'rage'],
      tagline: 'Everything you buy has a forest behind it. Meet it.',
      projectIds: [
        'proj_muOVEbHeGlxHs6uFm4kP8XCR',
        'proj_s0Dt9sivTkYLAptM2OfJSleb',
        'proj_hl3aUC07XMFN5SraVa7ofz8F',
        'proj_wqgGnda7Je2791h2214996tY',
      ],
    },
    {
      slug: 'amazon-route',
      label: 'The Amazon Route',
      tabs: ['wonder'],
      tagline: 'Somewhere in this river basin, a tree is waiting for you.',
      projectIds: [
        'proj_VZvRRK6FfUTT9FCs5gRWJJ8F',
        'proj_l7JbiejEuf9d4vvRMiDPQcgI',
        'proj_vZgdiSzgPahaQSYI8k86KUL8',
        'proj_4Xde51IgWMaMaUtEJdTP0Uzc',
      ],
    },
    {
      slug: 'underdog-bundle',
      label: 'The Underdog Bundle',
      tabs: ['staff-picks', 'love'],
      tagline: 'Small projects. Quiet work. Enormous hearts.',
      projectIds: [
        'proj_5h5KaMTA92ZnzUP4wgei4bpJ',
        'proj_ItArsrMDDKhVIKfpdST3d5sl',
        'proj_b4OndX9CMNR502QSOWaU3iNz',
        'proj_gNHIESSoSSpiYXLvoqe5TT2y',
      ],
    },
    {
      slug: 'undo-your-amazon-order',
      label: 'Undo Your Amazon Order',
      tabs: ['staff-picks', 'rage'],
      tagline: 'You clicked buy. Now click restore.',
      projectIds: [
        'proj_H11x6rzD9PQchjy90SjEcNsu',
        'proj_nXBzA2sbX2tm1D75p7bfJ81Z',
        'proj_Ly4lVzw50r6hJtocv74al9Ps',
        'proj_WZkyugryh35sMmZMmXCwq7YY',
      ],
    },
    {
      slug: 'where-your-coffee-grows',
      label: 'Where your Coffee grows',
      tabs: ['love'],
      tagline:
        'Every morning cup starts somewhere beautiful. Keep it that way.',
      projectIds: [
        'proj_sMTZsx6uBCgY0j7adKjJ3G11',
        'proj_PWNssUQw5JmqqSWZyEZ3yvyF',
        'proj_XcDe4nZMpnnsDvyIthFUzz94',
        'proj_JEhQJSLVpXFfSQismWJIAz1X',
      ],
    },
    {
      slug: 'worst-of-the-worst',
      label: 'Worst of the Worst',
      tabs: ['rage'],
      tagline: 'The hardest hit places. The ones that need you most.',
      projectIds: [
        'proj_ON5HC3IfetF3TO1EMWxjV6Uc',
        'proj_3aQZi1SCNWqqmM8duObtYchF',
        'proj_TivMbKmoOksSxo6T9iGWOGct',
        'proj_7WNIZ3c4U66QRlRsR6m5z57s',
      ],
    },
  ],
};
