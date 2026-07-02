import type { BundleConfig } from '@/lib/types/bundle';

export const BUNDLE_CONFIG: BundleConfig = {
  meta: {
    version: '1.0.0',
    workspace: 'DE',
    defaultTab: 'staff-picks',
  },
  supportProjects: {
    DE: 'proj_3VU0xgw7jJLDVDkMTpc5FC2w',
  },
  tabs: [
    {
      id: 'staff-picks',
      bundleSlugs: [
        'ancestral-lands',
        'plant-for-the-planet',
        'undo-your-amazon-order',
        'supply-chain-guilt-trip',
      ],
    },
    {
      id: 'wonder',
      bundleSlugs: ['amazon-route', 'roof-of-the-world', 'close-to-the-sea'],
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
        'proj_K55WdX94aY2ppmsRowXTLlUh',
        'proj_ucB4tXF37qpXgr6nWFo6Doit',
        'proj_WVUTszWrgJRFmUlbnFaBhKxF',
        'proj_RBSYPVsWbyzUkd10RVlzL1ED',
      ],
    },
    {
      slug: 'fix-what-we-broke',
      tabs: ['rage'],
      projectIds: [
        'proj_oJfz884YzcsmggrlNGw3E0N8',
        'proj_tl6PgJPAO4fdzK3i1focPhvo',
        'proj_No23wiy8Snz4g5OeT6Fy95pv',
        'proj_TivMbKmoOksSxo6T9iGWOGct',
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
        'proj_Ly4lVzw50r6hJtocv74al9Ps',
        'proj_wqgGnda7Je2791h2214996tY',
        'proj_muOVEbHeGlxHs6uFm4kP8XCR',
        'proj_7WNIZ3c4U66QRlRsR6m5z57s',
      ],
    },
    {
      slug: 'amazon-route',
      tabs: ['wonder'],
      projectIds: [
        'proj_VZvRRK6FfUTT9FCs5gRWJJ8F',
        'proj_Dx21gX18qbwkDs402aOK3fxf',
        'proj_vZgdiSzgPahaQSYI8k86KUL8',
        'proj_l7JbiejEuf9d4vvRMiDPQcgI',
      ],
    },
    {
      slug: 'underdog-bundle',
      tabs: ['love'],
      projectIds: [
        'proj_b4OndX9CMNR502QSOWaU3iNz',
        'proj_gNHIESSoSSpiYXLvoqe5TT2y',
        'proj_ItArsrMDDKhVIKfpdST3d5sl',
        'proj_MdWyzUGdKjMlRnFH6lmLBYE3',
      ],
    },
    {
      slug: 'undo-your-amazon-order',
      tabs: ['staff-picks', 'rage'],
      projectIds: [
        'proj_WZkyugryh35sMmZMmXCwq7YY',
        'proj_W1PvydmgXUo06zqL074DoUAa',
        'proj_29rIu5s4auh5wW4gvUtI63jK',
        'proj_8sONCwHESNzSLdPGiFmQE8Bk',
      ],
    },
    {
      slug: 'where-your-coffee-grows',
      tabs: ['love'],
      projectIds: [
        'proj_QjvcMzQklRiF6faUuaT5sSR1',
        'proj_PWNssUQw5JmqqSWZyEZ3yvyF',
        'proj_LbegUSF08Keuw0gMR5SdK3vu',
        'proj_fsj4WiG71hgjnSKe0PqBdthJ',
      ],
    },
    {
      slug: 'worst-of-the-worst',
      tabs: ['rage'],
      projectIds: [
        'proj_MPDwOE78pDfKV2YPQrKxpChQ',
        'proj_G9PEaVHm63pWyPDX50hndnAD',
        'proj_MWLo23PqXqZDGrn1zel3MAy6',
        'proj_adZmtfmLtRDGYtTmfVyrJDNA',
      ],
    },
    {
      slug: 'close-to-the-sea',
      tabs: ['wonder'],
      projectIds: [
        'proj_h27ErrwYmhAGB5jp6nyLGEkN',
        'proj_8q3sCjaD74tgPe7QzmFCmWfA',
        'proj_6WQ1vARx59EPe4R6UNVRTUaP',
        'proj_fVvnwD74dAwkWs7wuyj0XmzG',
      ],
    },
    {
      slug: 'plant-for-the-planet',
      tabs: ['staff-picks'],
      projectIds: [
        'proj_Ly4lVzw50r6hJtocv74al9Ps',
        'proj_WZkyugryh35sMmZMmXCwq7YY',
        'proj_nXBzA2sbX2tm1D75p7bfJ81Z',
        'proj_eKBbIt7Bzavu9o7xzCAqjS2t',
      ],
    },
  ],
};
