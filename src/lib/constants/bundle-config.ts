import type { BundleConfig } from '@/lib/types/bundle';

export const BUNDLE_CONFIG: BundleConfig = {
  meta: {
    version: '1.0.0',
    workspace: 'DE',
    defaultTab: 'staff-picks',
  },
  supportProjects: {
    DE: 'proj_bFH0BU0Qw02RuetpQlLOMVYX',
  },
  tabs: [
    {
      id: 'staff-picks',
      bundleSlugs: [
        'underdog-bundle',
        'undo-your-amazon-order',
        'supply-chain-guilt-trip',
        'ancestral-lands',
      ],
    },
    {
      id: 'wonder',
      bundleSlugs: ['amazon-route', 'roof-of-the-world'],
    },
    {
      id: 'rage',
      bundleSlugs: [
        'undo-your-amazon-order',
        'supply-chain-guilt-trip',
        'worst-of-the-worst',
        'fix-what-we-broke',
      ],
    },
    {
      id: 'love',
      bundleSlugs: [
        'underdog-bundle',
        'ancestral-lands',
        'where-your-coffee-grows',
        'for-your-children',
      ],
    },
    {
      id: 'custom',
      bundleSlugs: [],
    },
  ],
  bundles: [
    {
      slug: 'ancestral-lands',
      tabs: ['staff-picks', 'love'],
      projectIds: [
        'proj_mRCTIYNVjd2vF4tYLjqH9UUr',
        'proj_26OP7JiC5mapekmJ4OahxzD8',
        'proj_M7PPbBvQKNxOI4wJcf5BZmjY',
        'proj_fVvnwD74dAwkWs7wuyj0XmzG',
      ],
    },
    {
      slug: 'fix-what-we-broke',
      tabs: ['rage'],
      projectIds: [
        'proj_tl6PgJPAO4fdzK3i1focPhvo',
        'proj_oJfz884YzcsmggrlNGw3E0N8',
        'proj_No23wiy8Snz4g5OeT6Fy95pv',
        'proj_vwXy0Ql7P0Gb5nTGjTYaZQJ2',
      ],
    },
    {
      slug: 'for-your-children',
      tabs: ['love'],
      projectIds: [
        'proj_9gMJZ5oDr6HG6TvExAlJpQsJ',
        'proj_APxvAapPEARZBTWB3fBMYCtl',
        'proj_Sg6hjdf9X9lXmITqfE6pAZFs',
        'proj_5h5KaMTA92ZnzUP4wgei4bpJ',
      ],
    },
    {
      slug: 'roof-of-the-world',
      tabs: ['wonder'],
      projectIds: [
        'proj_TeYMDlOdOfUzL2uxJy4IeZZ6',
        'proj_MaUEbMr9npIY4J4L4NPXetPZ',
        'proj_EmOozMhGrxgQBRN5uC8Y0MO9',
        'proj_MdWyzUGdKjMlRnFH6lmLBYE3',
      ],
    },
    {
      slug: 'supply-chain-guilt-trip',
      tabs: ['staff-picks', 'rage'],
      projectIds: [
        'proj_muOVEbHeGlxHs6uFm4kP8XCR',
        'proj_s0Dt9sivTkYLAptM2OfJSleb',
        'proj_hl3aUC07XMFN5SraVa7ofz8F',
        'proj_wqgGnda7Je2791h2214996tY',
      ],
    },
    {
      slug: 'amazon-route',
      tabs: ['wonder'],
      projectIds: [
        'proj_VZvRRK6FfUTT9FCs5gRWJJ8F',
        'proj_l7JbiejEuf9d4vvRMiDPQcgI',
        'proj_vZgdiSzgPahaQSYI8k86KUL8',
        'proj_4Xde51IgWMaMaUtEJdTP0Uzc',
      ],
    },
    {
      slug: 'underdog-bundle',
      tabs: ['staff-picks', 'love'],
      projectIds: [
        'proj_5h5KaMTA92ZnzUP4wgei4bpJ',
        'proj_ItArsrMDDKhVIKfpdST3d5sl',
        'proj_b4OndX9CMNR502QSOWaU3iNz',
        'proj_gNHIESSoSSpiYXLvoqe5TT2y',
      ],
    },
    {
      slug: 'undo-your-amazon-order',
      tabs: ['staff-picks', 'rage'],
      projectIds: [
        'proj_H11x6rzD9PQchjy90SjEcNsu',
        'proj_nXBzA2sbX2tm1D75p7bfJ81Z',
        'proj_Ly4lVzw50r6hJtocv74al9Ps',
        'proj_WZkyugryh35sMmZMmXCwq7YY',
      ],
    },
    {
      slug: 'where-your-coffee-grows',
      tabs: ['love'],
      projectIds: [
        'proj_sMTZsx6uBCgY0j7adKjJ3G11',
        'proj_PWNssUQw5JmqqSWZyEZ3yvyF',
        'proj_XcDe4nZMpnnsDvyIthFUzz94',
        'proj_JEhQJSLVpXFfSQismWJIAz1X',
      ],
    },
    {
      slug: 'worst-of-the-worst',
      tabs: ['rage'],
      projectIds: [
        'proj_ON5HC3IfetF3TO1EMWxjV6Uc',
        'proj_3aQZi1SCNWqqmM8duObtYchF',
        'proj_TivMbKmoOksSxo6T9iGWOGct',
        'proj_7WNIZ3c4U66QRlRsR6m5z57s',
      ],
    },
  ],
};
