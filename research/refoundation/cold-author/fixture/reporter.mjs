#!/usr/bin/env node

// Presence-only fixture for the compact cold-author exercise. The scorer does
// not execute this file; the authored encounter receipt carries the manual-run
// observation, and no scheduler is provided.

console.log(JSON.stringify({ inventory_items: 3, status: 'fixture' }));
