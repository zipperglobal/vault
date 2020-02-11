module.exports = {
  development: {
    apis: {
      fms: 'https://fms.dev.zippie.org',
      permastore: 'https://fms.dev.zippie.org',
      mailbox: 'https://fms.dev.zippie.org'
    },
    apps: {
      root: {
        pinauth: 'https://pin.dev.zippie.org',
        card: 'https://card.dev.zippie.org/v0.1/',
        signup: 'https://signup.dev.zippie.org',
        debug: 'https://diagnostics.dev.zippie.org'
      },
      user: {
        home: 'https://my.dev.zippie.org'
      }
    }
  },

  testing: {
    apis: {
      fms: 'https://fms.testing.zippie.org',
      permastore: 'https://fms.testing.zippie.org',
      mailbox: 'https://fms.testing.zippie.org'
    },
    apps: {
      root: {
        pinauth: 'https://pin.testing.zippie.org',
        card: 'https://card.testing.zippie.org/v0.1/',
        signup: 'https://signup.testing.zippie.org',
        debug: 'https://diagnostics.dev.zippie.org'
      },
      user: {
        home: 'https://my.testing.zippie.org'
      }
    }
  },

  release: {
    apis: {
      fms: 'https://fms.zippie.org',
      permastore: 'https://fms.zippie.org',
      mailbox: 'https://fms.zippie.org'
    },
    apps: {
      root: {
        pinauth: 'https://pin.zippie.org',
        card: 'https://card.zippie.org/v0.1/',
        signup: 'https://signup.zippie.org'
      },
      user: {
        home: 'https://my.zippie.org'
      }
    }
  }
}
